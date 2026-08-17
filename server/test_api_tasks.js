const axios = require('axios');

async function testApi() {
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'worker1',
            password: 'Worker123',
            role: 'worker'
        });
        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;

        console.log(`Logged in as worker1 (ID: ${userId})`);

        const tasksRes = await axios.get('http://localhost:5000/api/tasks', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('JSON_OUTPUT_START');
        console.log(JSON.stringify(tasksRes.data, null, 2));
        console.log('JSON_OUTPUT_END');
        process.exit(0);
    } catch (err) {
        console.error('API Test Error:', err.response?.data || err.message);
        process.exit(1);
    }
}

testApi();
