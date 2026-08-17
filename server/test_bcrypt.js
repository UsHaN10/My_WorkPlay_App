const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function testPassword() {
    try {
        const username = 'worker1';
        const passwordToTest = '123456';

        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.log(`User ${username} not found`);
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(passwordToTest, user.password);
        console.log(`Password test for ${username}:`);
        console.log(`- Password tested: ${passwordToTest}`);
        console.log(`- Stored hash: ${user.password}`);
        console.log(`- Is Match: ${isMatch}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testPassword();
