const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const hashedPassword = await bcrypt.hash('Worker123', 10);
        await User.update({ password: hashedPassword }, { where: { username: 'worker1' } });
        console.log('Password for worker1 reset to Worker123');
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}

resetPassword();
