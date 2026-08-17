const { Task } = require('./models');

async function createTestTasks() {
    try {
        // Create a Global Task
        await Task.create({
            title: 'Global Test Task ' + Date.now(),
            description: 'This is a global task for everyone.',
            rewardCoins: 10,
            rewardXp: 20,
            status: 'pending',
            assignedToUserId: null
        });

        // Create an Assigned Task for UserId 2
        await Task.create({
            title: 'Assigned Test Task ' + Date.now(),
            description: 'This is a personal mission for user 2.',
            rewardCoins: 50,
            rewardXp: 100,
            status: 'pending',
            assignedToUserId: 2
        });

        console.log('Test tasks created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating tasks:', err);
        process.exit(1);
    }
}

createTestTasks();
