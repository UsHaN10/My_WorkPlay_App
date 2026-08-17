const { sequelize } = require('./server/models');

async function viewDatabase() {
    try {
        console.log('\n📊 DATABASE TABLES AND STRUCTURE\n');
        console.log('='.repeat(80));

        // Get all table names
        const [tables] = await sequelize.query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        console.log(`\n✅ Found ${tables.length} tables:\n`);

        for (const table of tables) {
            const tableName = table.name;
            console.log(`\n📋 TABLE: ${tableName}`);
            console.log('-'.repeat(80));

            // Get table structure
            const [columns] = await sequelize.query(`PRAGMA table_info(${tableName})`);

            console.log('\nColumns:');
            columns.forEach(col => {
                const pk = col.pk ? ' [PRIMARY KEY]' : '';
                const notNull = col.notnull ? ' NOT NULL' : '';
                const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
                console.log(`  - ${col.name}: ${col.type}${pk}${notNull}${defaultVal}`);
            });

            // Get row count
            const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`\n📊 Total Rows: ${count[0].count}`);

            // Show sample data (first 3 rows)
            if (count[0].count > 0) {
                const [rows] = await sequelize.query(`SELECT * FROM ${tableName} LIMIT 3`);
                console.log('\n🔍 Sample Data (first 3 rows):');
                console.table(rows);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Database inspection complete!\n');

    } catch (error) {
        console.error('❌ Error viewing database:', error);
    } finally {
        await sequelize.close();
    }
}

viewDatabase();
