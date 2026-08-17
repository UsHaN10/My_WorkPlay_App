import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const log = (msg) => console.log(`[TEST] ${msg}`);

async function run() {
    console.log('Starting Test Script...');
    try {
        log('Attempting to connect to ' + API_URL);
        const res = await axios.get(API_URL.replace('/api', '')).catch(e => ({ status: e.code || 'ERR', error: e.message }));
        log('Server Health Check: ' + (res.status === 200 ? 'OK' : JSON.stringify(res)));

        if (res.status !== 200 && res.error) {
            console.error("Server seems down. Is it running on port 5000?");
            process.exit(1);
        }

        // Try Admin Login
        log('Trying login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { username: 'admin1', password: 'password123', role: 'admin' })
            .catch(e => {
                if (e.response && e.response.status === 401) return { status: 401 };
                throw e;
            });

        log('Login result: ' + loginRes.status);

        if (loginRes.status === 401) {
            log('User not found, proceeding to register...');
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                username: 'admin1',
                password: 'password123',
                role: 'admin',
                fullName: 'Admin One',
                email: 'admin1@test.com',
                department: 'Test'
            });
            log('Registered Admin 1: ' + regRes.status);
        }

        console.log('SUCCESS: Basic connectivity established.');

    } catch (e) {
        console.error('CRITICAL ERROR:');
        console.error(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
}

run();
