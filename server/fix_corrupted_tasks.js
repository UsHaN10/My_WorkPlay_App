const { Task, sequelize } = require('./models');

async function fixCorruptedTasks() {
    try {
        console.log('🔍 Checking for corrupted tasks...\n');

        const tasks = await Task.findAll();
        let fixedCount = 0;

        for (const task of tasks) {
            let needsFix = false;
            const updates = {};

            // Problem 1 & 2: Fix corrupted descriptions
            if (task.description && (
                task.description.includes('Prepagns') ||
                task.description.includes('adf') ||
                task.description.length < 10 ||
                /[^\x00-\x7F]+/.test(task.description) // Non-ASCII characters
            )) {
                console.log(`❌ Task ${task.id}: Corrupted description detected`);
                needsFix = true;

                // Clean up description
                updates.description = task.description
                    .replace(/Prepagns/g, 'Prepare')
                    .replace(/adf/g, '')
                    .replace(/[^\x00-\x7F]+/g, '') // Remove non-ASCII
                    .trim();
            }

            // Problem 3 & 4: Fix corrupted titles
            if (task.title && (
                task.title.length > 200 ||
                task.title.includes('\u0000') ||
                /[^\x00-\x7F]+/.test(task.title)
            )) {
                console.log(`❌ Task ${task.id}: Corrupted title detected`);
                needsFix = true;
                updates.title = task.title.substring(0, 200).replace(/[^\x00-\x7F]+/g, '').trim();
            }

            // Problem 5: Fix null/undefined values
            if (task.workerComment === undefined) updates.workerComment = null;
            if (task.adminComment === undefined) updates.adminComment = null;
            if (task.verificationPhoto === undefined) updates.verificationPhoto = null;

            // Problem 6: Validate dates
            if (task.createdAt && isNaN(new Date(task.createdAt).getTime())) {
                console.log(`❌ Task ${task.id}: Invalid createdAt date`);
                needsFix = true;
                updates.createdAt = new Date();
            }

            if (task.updatedAt && isNaN(new Date(task.updatedAt).getTime())) {
                console.log(`❌ Task ${task.id}: Invalid updatedAt date`);
                needsFix = true;
                updates.updatedAt = new Date();
            }

            // Apply fixes
            if (needsFix || Object.keys(updates).length > 0) {
                await task.update(updates);
                fixedCount++;
                console.log(`✅ Task ${task.id} fixed`);
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} corrupted tasks`);

        // Display cleaned tasks
        console.log('\n📋 Current Tasks:');
        const cleanedTasks = await Task.findAll();
        cleanedTasks.forEach(t => {
            console.log(`\nID: ${t.id}`);
            console.log(`Title: ${t.title}`);
            console.log(`Description: ${t.description?.substring(0, 50)}...`);
            console.log(`Status: ${t.status}`);
            console.log(`Assigned To: ${t.assignedToUserId || 'None'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing tasks:', err);
        process.exit(1);
    }
}

fixCorruptedTasks();
