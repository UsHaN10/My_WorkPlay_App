const express = require('express');
const router = express.Router();
const { User, ExchangeRequest, Transaction, sequelize } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getIo } = require('../socket');

// WPC to SLR Exchange Request
// Client: POST /api/exchange
router.post('/exchange', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');
        if (user.coins < amount) throw new Error('Insufficient WPC balance');

        user.coins -= amount;
        await user.save({ transaction: t });

        await Transaction.create({
            UserId: user.id,
            amount: -amount,
            type: 'spend',
            reason: `Exchange Request Locked: ${amount} WPC`
        }, { transaction: t });

        const request = await ExchangeRequest.create({
            UserId: user.id,
            amount,
            status: 'pending'
        }, { transaction: t });

        await t.commit();

        // Notify Admins of new request
        const io = getIo();
        if (io) io.emit('TASK_UPDATE');

        res.json({ success: true, request });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Pending Exchange Requests
// Client: GET /api/admin/exchange-requests
router.get('/admin/exchange-requests', authenticateToken, isAdmin, async (req, res) => {
    try {
        const requests = await ExchangeRequest.findAll({
            where: { status: 'pending' },
            include: User,
            order: [['createdAt', 'ASC']]
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Process Exchange Request
// Client: PUT /api/admin/exchange-requests/:id
router.put('/admin/exchange-requests/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status, message } = req.body;
        const request = await ExchangeRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        request.status = status;
        request.adminMessage = message;
        await request.save();

        if (status === 'rejected') {
            const user = await User.findByPk(request.UserId);
            if (user) {
                user.coins += request.amount;
                await user.save();
                await Transaction.create({
                    UserId: user.id,
                    amount: request.amount,
                    type: 'earn',
                    reason: `Exchange Rejected Refund: ${request.amount} WPC`
                });
            }
        }

        // Notify client of status change
        const io = getIo();
        if (io) {
            io.emit('TASK_UPDATE', { message: 'Exchange Request Processed', status });
            io.emit('MINT_UPDATE', { message: 'Balance Refresh' });
        }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get User Exchange Requests
// Client: GET /api/exchange-requests/:userId
router.get('/exchange-requests/:userId', authenticateToken, async (req, res) => {
    try {
        if (req.user.id != req.params.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const requests = await ExchangeRequest.findAll({
            where: { UserId: req.params.userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
