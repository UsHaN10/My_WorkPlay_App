const express = require('express');
const router = express.Router();
const { User, Task, sequelize, Treasury } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        // 1. Circulating Supply
        const circulatingSupply = await User.sum('coins', { where: { role: 'worker' } }) || 0;

        // 2. Treasury Balance
        const treasury = await Treasury.findByPk(1);
        const treasuryBalance = treasury ? treasury.balance : 0;

        // 3. User Stats
        const totalWorkers = await User.count({ where: { role: 'worker' } });
        const totalXp = await User.sum('xp', { where: { role: 'worker' } }) || 0;

        // 4. Task Analytics (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const tasksTrend = await Task.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('updatedAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                status: 'completed',
                updatedAt: { [Op.gte]: sevenDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('updatedAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('updatedAt')), 'ASC']]
        });

        res.json({
            circulatingSupply,
            treasuryBalance,
            totalWorkers,
            totalXp,
            tasksTrend
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
