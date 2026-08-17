const express = require('express');
const router = express.Router();
const { User, Transaction } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get All Workers (Admin)
// Client: GET /api/admin/workers
router.get('/admin/workers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const workers = await User.findAll({ where: { role: 'worker' } });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Leaderboard (Public/Worker)
// Client: GET /api/leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const workers = await User.findAll({
            where: { role: 'worker' },
            attributes: ['id', 'username', 'fullName', 'rank', 'xp', 'coins'],
            order: [['xp', 'DESC']]
        });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Profile
// Client: GET /api/user/:id
router.get('/user/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile Picture
// Client: POST /api/user/:id/upload
router.post('/user/:id/upload', authenticateToken, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        if (req.user.id != req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        user.profilePic = `${baseUrl}/uploads/${req.file.filename}`;
        await user.save();

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Transactions
// Client: GET /api/transactions/:userId
router.get('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        // Security: only allow users to see their own transactions, or admin
        if (req.user.id != req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const transactions = await Transaction.findAll({
            where: { UserId: req.params.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
