const express = require('express');
const router = express.Router();
const { User, Task, Treasury, Transaction } = require('../models');
const { authenticateToken, isAdmin, isVIPAdmin } = require('../middleware/auth');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../models');
const { getIo } = require('../socket');
const upload = require('../middleware/upload');

// Helper for Socket Emissions
const emitTaskUpdate = (data) => {
    try {
        const io = getIo();
        if (io) {
            io.emit('TASK_UPDATE', data);
            // Also refresh stats/leaderboard if it's a Completion or Assignment change
            io.emit('STATS_UPDATE', { message: 'Data Refresh Requested' });
        }
    } catch (e) { console.error("Socket Emit Error:", e); }
};

const emitMintUpdate = (message) => {
    try {
        const io = getIo();
        io.emit('MINT_UPDATE', { message });
    } catch (e) { console.error("Socket Emit Error:", e); }
};

// Create Task (Admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const isGlobal = !req.body.assignedToUserId;
        const taskData = {
            ...req.body,
            assignedToUserId: req.body.assignedToUserId ? parseInt(req.body.assignedToUserId, 10) : null,
            skillCategory: req.body.skillCategory || null,
            targetRole: req.body.targetRole || null,
            timeLimitMinutes: req.body.timeLimitMinutes ? parseInt(req.body.timeLimitMinutes, 10) : null,
            isGlobal: isGlobal
        };
        const task = await Task.create(taskData);

        emitTaskUpdate({ message: 'New Task Created', taskId: task.id });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Task
router.get('/:taskId', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Tasks
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const tasks = await Task.findAll();
            return res.json(tasks);
        }

        // Fetch full user to get jobRole reliably without needing it in the JWT
        const fullUser = await User.findByPk(req.user.id);

        const tasks = await Task.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { assignedToUserId: req.user.id },
                    { isGlobal: true, targetRole: fullUser.jobRole || null },
                    { isGlobal: true, targetRole: null } // Global tasks
                ]
            }
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Task (Worker)
router.post('/:taskId/start', authenticateToken, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Find task with a lock to prevent concurrent double-starts
        const task = await Task.findByPk(req.params.taskId, { lock: t.LOCK.UPDATE, transaction: t });

        if (!task) throw new Error('Task not found');
        if (task.status !== 'pending') throw new Error('Task is already started or completed');

        // If it's a private task assigned to someone else
        if (task.assignedToUserId && task.assignedToUserId !== req.user.id) {
            throw new Error('This task is assigned to another worker');
        }

        task.status = 'in_progress';
        task.startedAt = new Date();

        // If it was global, officially claim it
        if (!task.assignedToUserId) {
            task.assignedToUserId = req.user.id;
        }

        await task.save({ transaction: t });
        await t.commit();

        emitTaskUpdate({
            message: 'Task Started',
            taskId: task.id,
            status: 'in_progress',
            userId: req.user.id
        });

        res.json({ success: true, task });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

// Submit Task for Review (Worker)
router.post('/:taskId/submit', authenticateToken, upload.single('verificationPhoto'), async (req, res) => {
    try {
        const { workerComment } = req.body;
        const task = await Task.findByPk(req.params.taskId);

        if (!task) return res.status(404).json({ error: 'Task not found' });
        if (task.status === 'completed') return res.status(400).json({ error: 'Task already completed' });
        if (task.assignedToUserId && task.assignedToUserId !== req.user.id) {
            return res.status(403).json({ error: 'Task assigned to someone else' });
        }

        // Time Limit Expiration Check
        if (task.timeLimitMinutes && task.startedAt) {
            const timeLimitMs = task.timeLimitMinutes * 60 * 1000;
            const elapsedMs = Date.now() - new Date(task.startedAt).getTime();
            if (elapsedMs > timeLimitMs) {
                // Task failed due to time limit
                task.status = 'rejected';
                task.adminComment = 'Task submission failed automatically: Time Limit Expired.';
                await task.save();

                emitTaskUpdate({ message: 'Task Expired', taskId: task.id, status: 'rejected' });
                return res.status(400).json({ error: 'Task time limit has unfortunately expired.' });
            }
        }

        task.status = 'pending_review';
        task.workerComment = workerComment;

        // Assign task to submittor if it's a global task (fallback)
        if (!task.assignedToUserId) {
            task.assignedToUserId = req.user.id;
        }

        if (req.file) {
            task.verificationPhoto = `/uploads/${req.file.filename}`;
        }

        await task.save();

        emitTaskUpdate({
            message: 'Task Submitted',
            taskId: task.id,
            status: 'pending_review',
            userId: req.user.id
        });

        res.json({ success: true, task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unsubmit Task (Remove from Review) - Worker
router.put('/:taskId/unsubmit', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.taskId);
        if (!task) throw new Error('Task not found');
        if (task.assignedToUserId !== req.user.id) throw new Error('Task not assigned to you');
        if (task.status !== 'pending_review') throw new Error('Only tasks pending review can be unsubmitted');

        // Check if time expired before unsubmitting back to in_progress
        if (task.timeLimitMinutes && task.startedAt) {
            const elapsedMs = Date.now() - new Date(task.startedAt).getTime();
            if (elapsedMs > task.timeLimitMinutes * 60 * 1000) {
                throw new Error('Task time limit has already expired, cannot unsubmit to resume.');
            }
        }

        task.status = 'in_progress';
        await task.save();

        emitTaskUpdate({ message: 'Task Unsubmitted', taskId: task.id, status: task.status });
        res.json({ success: true, task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unassign Task (Remove from Personal) - Worker
router.put('/:taskId/unassign', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.taskId);
        if (!task) throw new Error('Task not found');
        if (task.assignedToUserId !== req.user.id) throw new Error('Task not assigned to you');
        if (task.status === 'completed') throw new Error('Cannot unassign a completed task');

        if (task.isGlobal) {
            task.assignedToUserId = null;
        }
        task.status = 'pending';
        task.startedAt = null;
        await task.save();

        emitTaskUpdate({ message: 'Task Unassigned', taskId: task.id, status: task.status });
        res.json({ success: true, task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Review Task (Admin)
router.post('/:taskId/review', authenticateToken, isAdmin, async (req, res) => {
    const { action, adminComment } = req.body;
    const t = await sequelize.transaction();

    try {
        const task = await Task.findByPk(req.params.taskId);
        if (!task) throw new Error('Task not found');
        if (task.status !== 'pending_review') throw new Error('Task is not pending review');

        if (action === 'approve') {
            const treasury = await Treasury.findByPk(1, { transaction: t });
            if (!treasury || treasury.balance < task.rewardCoins) {
                throw new Error(`Treasury Balance (${treasury?.balance || 0}) is too low to pay ${task.rewardCoins} WPC. Please mint more coins.`);
            }

            const user = await User.findByPk(task.assignedToUserId, { transaction: t });
            if (!user) throw new Error('Assigned worker not found');

            // Rewards & Stats
            treasury.balance -= task.rewardCoins;

            // Update user instances in-memory to prevent sequential overwrite bugs
            user.coins = (user.coins || 0) + task.rewardCoins;
            user.xp = (user.xp || 0) + task.rewardXp;
            user.sp = (user.sp || 0) + (task.rewardSp || 0);

            // Allocate specific skill points if category is specified
            if (task.skillCategory) {
                try {
                    let pointMap = {};
                    if (task.skillCategory.startsWith('{')) {
                        pointMap = JSON.parse(task.skillCategory);
                    } else {
                        // Fallback for old tasks
                        const categories = task.skillCategory.split(',').map(s => s.trim()).filter(s => s);
                        categories.forEach(cat => { pointMap[cat] = task.rewardSp || 0; });
                    }

                    const currentSkills = user.skillLevels || {};
                    let modified = false;

                    for (const [cat, spRaw] of Object.entries(pointMap)) {
                        const sp = Number(spRaw);
                        if (sp > 0) {
                            currentSkills[cat] = (currentSkills[cat] || 0) + sp;
                            modified = true;
                        }
                    }

                    if (modified) {
                        user.changed('skillLevels', true);
                        user.skillLevels = currentSkills;
                    }
                } catch (e) {
                    console.error("Failed to parse mapped skill points", e);
                }
            }

            // Ensure task status is updated
            task.status = 'completed';
            task.adminComment = adminComment;

            await treasury.save({ transaction: t });
            await task.save({ transaction: t });

            // Single definitive save ensuring all memory updates are committed safely.
            await user.save({ transaction: t });

            await Transaction.create({
                UserId: user.id,
                amount: task.rewardCoins,
                type: 'earn',
                reason: `Task Approved: ${task.title}`
            }, { transaction: t });

        } else if (action === 'reject') {
            task.status = 'rejected';
            task.adminComment = adminComment;
            await task.save({ transaction: t });
        } else {
            throw new Error('Invalid action');
        }

        await t.commit();

        emitTaskUpdate({
            taskId: task.id,
            status: task.status,
            userId: task.assignedToUserId
        });

        // Refresh global leaderboards
        try {
            const io = require('../socket').getIo();
            io.emit('STATS_UPDATE', { message: 'Leaderboard Refreshed' });
        } catch (e) {
            console.error("STATS_UPDATE Emit Error:", e);
        }

        if (action === 'approve') {
            emitMintUpdate('Treasury Updated (Task Reward)');
        }

        res.json({ success: true, task });

    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

// Delete Task (Admin Only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await task.destroy();

        emitTaskUpdate({ message: 'Task Deleted', taskId: req.params.id });
        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Arena Win - Claim Rewards (Worker)
router.post('/arena-win', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.increment({ coins: 50, xp: 50 });

        // Refresh global leaderboards
        try {
            const io = getIo();
            io.emit('STATS_UPDATE', { message: 'Arena win updated scores' });
        } catch (e) { }

        res.json({ success: true, earned: 50 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
