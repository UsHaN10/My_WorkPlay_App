const { Task } = require('./models');

async function checkTasks() {
    try {
        const tasks = await Task.findAll();
        console.log('JSON_OUTPUT_START');
        console.log(JSON.stringify(tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            assignedToUserId: t.assignedToUserId
        })), null, 2));
        console.log('JSON_OUTPUT_END');
        process.exit(0);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        process.exit(1);
    }
}

checkTasks();
