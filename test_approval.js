const { sequelize, User, Task, Treasury, Transaction } = require('./server/models');

async function testApproval() {
    const t = await sequelize.transaction();
    try {
        const user = await User.findOne({ where: { username: 'worker0' }, transaction: t });
        const task = await Task.create({
            title: 'Test Task',
            description: 'Test',
            rewardCoins: 100,
            rewardXp: 50,
            status: 'pending_review',
            assignedToUserId: user.id
        }, { transaction: t });

        console.log(`Initial User State: Coins: ${user.coins}, XP: ${user.xp}`);

        // Simulation of the new review logic
        await user.increment({ coins: task.rewardCoins, xp: task.rewardXp }, { transaction: t });
        await user.reload({ transaction: t });
        await user.save({ transaction: t }); // triggers hook

        task.status = 'completed';
        await task.save({ transaction: t });

        await Transaction.create({
            UserId: user.id,
            amount: task.rewardCoins,
            type: 'earn',
            reason: 'Test Reward'
        }, { transaction: t });

        await t.commit();
        console.log("Transaction Committed.");

        const updatedUser = await User.findByPk(user.id);
        console.log(`Updated User State: Coins: ${updatedUser.coins}, XP: ${updatedUser.xp}, Rank: ${updatedUser.rank}`);

    } catch (e) {
        await t.rollback();
        console.error("Test failed:", e);
    } finally {
        process.exit();
    }
}

testApproval();
