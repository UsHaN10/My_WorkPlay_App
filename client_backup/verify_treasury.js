import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
let admin1Token = '';
let admin2Token = '';
let workerToken = '';

const log = (msg) => console.log(`[TEST] ${msg}`);
const err = (msg, e) => {
    console.error(`[ERROR] ${msg}`);
    if (e.response) {
        console.error('Status:', e.response.status);
        console.error('Data:', JSON.stringify(e.response.data, null, 2));
    } else {
        console.error('Message:', e.message);
    }
};

const api = axios.create({ baseURL: API_URL });

async function loginOrRegister(username, role) {
    try {
        log(`Logging in ${username}...`);
        const res = await api.post('/auth/login', { username, password: 'password123', role });
        return res.data.token;
    } catch (e) {
        if (e.response && e.response.status === 401) {
            log(`${username} not found (or wrong pass), registering...`);
            try {
                const res = await api.post('/auth/register', {
                    username,
                    password: 'password123',
                    role,
                    fullName: `${username} User`,
                    email: `${username}@example.com`,
                    department: 'Test'
                });
                return res.data.token;
            } catch (regError) {
                // If register fails because user exists (race condition or previous run with diff pass), try login again? 
                // Or just fail.
                throw regError;
            }
        }
        throw e;
    }
}

async function run() {
    try {
        // 1. Setup Users
        admin1Token = await loginOrRegister('admin1', 'admin');
        admin2Token = await loginOrRegister('admin2', 'admin');
        workerToken = await loginOrRegister('worker1', 'worker');

        log('Tokens obtained.');

        // 2. Initial Treasury Check
        log('Checking Initial Treasury Balance...');
        const initRes = await api.get('/admin/treasury', { headers: { Authorization: `Bearer ${admin1Token}` } });
        const initBalance = initRes.data.treasury.balance;
        log(`Initial Balance: ${initBalance}`);

        // 3. Admin 1 Requests Minting
        const MINT_AMOUNT = 500;
        const ref = `TEST-${Date.now()}`;
        log(`Admin 1 requesting mint of ${MINT_AMOUNT} with ref ${ref}...`);

        const mintRes = await api.post('/admin/mint',
            { amount: MINT_AMOUNT, paymentReference: ref },
            { headers: { Authorization: `Bearer ${admin1Token}` } }
        );
        const mintRequestId = mintRes.data.id;
        log(`Mint Request ID: ${mintRequestId}`);

        // 4. Admin 2 Approves
        log('Admin 2 approving...');
        await api.post(`/admin/mint-requests/${mintRequestId}/approve`, {},
            { headers: { Authorization: `Bearer ${admin2Token}` } }
        );
        log('Approval sent.');

        // 5. Check Balance Updated
        const updatedRes = await api.get('/admin/treasury', { headers: { Authorization: `Bearer ${admin1Token}` } });
        const newBalance = updatedRes.data.treasury.balance;
        log(`New Balance: ${newBalance}`);

        if (newBalance !== initBalance + MINT_AMOUNT) {
            throw new Error(`Balance Mismatch! Expected ${initBalance + MINT_AMOUNT}, got ${newBalance}`);
        }
        log('SUCCESS: Treasury Balance updated correctly.');

        // 6. Create Task with Reward (if balance allows)
        log('Creating Task...');
        const taskRes = await api.post('/tasks', {
            title: 'Treasury Test Task ' + Date.now(),
            description: 'Testing deduction',
            rewardCoins: 100,
            rewardXp: 10,
            assignedToUserId: null // Global
        }, { headers: { Authorization: `Bearer ${admin1Token}` } });
        const taskId = taskRes.data.id;

        // 7. Worker Completes Task
        log(`Worker completing task ${taskId}...`);
        await api.post(`/tasks/${taskId}/complete`, {}, { headers: { Authorization: `Bearer ${workerToken}` } });

        // 8. Check Balance Deducted
        const finalRes = await api.get('/admin/treasury', { headers: { Authorization: `Bearer ${admin1Token}` } });
        const finalBalance = finalRes.data.treasury.balance;

        if (finalBalance !== newBalance - 100) {
            throw new Error(`Balance Deduction Failed! Expected ${newBalance - 100}, got ${finalBalance}`);
        }
        log(`Final Balance: ${finalBalance}`);
        log('SUCCESS: Task completion deducted from treasury.');

        console.log('\nALL TESTS PASSED');
        process.exit(0);

    } catch (e) {
        err('Test Failed', e);
        process.exit(1);
    }
}

run();
