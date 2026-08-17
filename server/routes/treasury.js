const express = require('express');
const router = express.Router();
const { User, Treasury, MintRequest, MintApproval, Transaction, sequelize } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getIo } = require('../socket');

// Get Treasury Info
router.get('/treasury', authenticateToken, isAdmin, async (req, res) => {
    try {
        let treasury = await Treasury.findByPk(1);
        if (!treasury) {
            [treasury] = await Treasury.findOrCreate({ where: { id: 1 }, defaults: { balance: 0 } });
        }
        const mintRequests = await MintRequest.findAll({
            include: [
                { model: User, as: 'requester' },
                { model: MintApproval, include: [{ model: User, as: 'approver' }] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ treasury, mintRequests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Mint Request
router.post('/mint', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { amount, paymentReference } = req.body;
        const request = await MintRequest.create({
            requesterId: req.user.id,
            amount,
            paymentReference
        });

        // Notify Admins
        try {
            const io = getIo();
            if (io) io.emit('MINT_UPDATE', { message: 'New Mint Request Created' });
        } catch (e) { }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve Mint Request
router.post('/mint-requests/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const request = await MintRequest.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!request) throw new Error('Request not found');
        if (request.status !== 'pending') throw new Error('Request not pending');

        // Prevent Self-Approval
        if (request.requesterId === req.user.id) {
            return res.status(403).json({ error: 'Cannot approve your own minting request' });
        }

        // Check if already approved by this user
        const existingApproval = await MintApproval.findOne({
            where: { MintRequestId: request.id, approverId: req.user.id },
            transaction: t
        });
        if (existingApproval) throw new Error('You have already approved this request');

        // Create Approval
        await MintApproval.create({
            MintRequestId: request.id,
            approverId: req.user.id
        }, { transaction: t });

        // Increment Count
        request.approvalsCount += 1;

        // APPROVAL THRESHOLD Logic
        // Requires 2 approvals (excluding requester -> effectively 3 admins involved in consensus)
        if (request.approvalsCount >= 2) {
            request.status = 'approved';

            const treasury = await Treasury.findByPk(1);
            treasury.balance += request.amount;
            await treasury.save({ transaction: t });

            await Transaction.create({
                UserId: request.requesterId,
                amount: request.amount,
                type: 'earn',
                reason: `Treasury Minted: ${request.amount} (Ref: ${request.paymentReference})`
            }, { transaction: t });

            // Emit Socket Event
            try {
                const io = getIo();
                io.emit('MINT_UPDATE', {
                    message: `Mint Request #${request.id} Approved`,
                    balance: treasury.balance
                });
            } catch (e) { console.error("Socket Emit Error:", e); }
        }

        await request.save({ transaction: t });
        await t.commit();
        res.json({ success: true, request });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

// Reject Mint Request
router.post('/mint-requests/:id/reject', authenticateToken, isAdmin, async (req, res) => {
    try {
        const request = await MintRequest.findByPk(req.params.id);
        if (!request) throw new Error('Request not found');
        if (request.status !== 'pending') throw new Error('Request not pending');

        request.status = 'rejected';
        await request.save();

        // Notify Admins
        try {
            const io = getIo();
            if (io) io.emit('MINT_UPDATE', { message: 'Mint Request Rejected' });
        } catch (e) { }

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
