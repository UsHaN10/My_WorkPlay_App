const { sequelize } = require('./server/models');

async function listTables() {
    try {
        // Get all table names
        const [tables] = await sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );

        console.log('\n========================================');
        console.log('DATABASE TABLES IN WorkPlay');
        console.log('========================================\n');

        tables.forEach((table, index) => {
            console.log(`${index + 1}. ${table.name}`);
        });

        console.log(`\nTotal Tables: ${tables.length}`);
        console.log('========================================\n');

        // Show row counts
        console.log('ROW COUNTS:');
        console.log('----------------------------------------');
        for (const table of tables) {
            const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
            console.log(`${table.name.padEnd(25)} : ${count[0].count} rows`);
        }
        console.log('========================================\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

listTables();
