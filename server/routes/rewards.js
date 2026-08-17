const express = require('express');
const router = express.Router();
const { User, Transaction, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get Rewards
router.get('/', authenticateToken, (req, res) => {
    res.json([
        { id: 1, name: 'Premium Coffee Cup', price: 50, icon: 'Coffee' },
        { id: 2, name: 'Extra Bread Break', price: 100, icon: 'Shield' },
        { id: 3, name: 'Early Leave (30m)', price: 500, icon: 'Clock' },
        { id: 4, name: 'WorkPlay Badge', price: 200, icon: 'Award' },
    ]);
});

router.post('/:rewardId/redeem', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { rewardId } = req.params;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const rewards = [
            { id: 1, name: 'Premium Coffee Cup', price: 50 },
            { id: 2, name: 'Extra Bread Break', price: 100 },
            { id: 3, name: 'Early Leave (30m)', price: 500 },
            { id: 4, name: 'WorkPlay Badge', price: 200 },
        ];
        const reward = rewards.find(r => r.id == rewardId);
        if (!reward) throw new Error('Reward not found');

        if (user.coins < reward.price) throw new Error('Insufficient coins');

        user.coins -= reward.price;
        await user.save({ transaction: t });

        await Transaction.create({
            UserId: user.id,
            amount: -reward.price,
            type: 'spend',
            reason: `Redeemed: ${reward.name}`
        }, { transaction: t });

        await t.commit();
        res.json({ success: true, user });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
