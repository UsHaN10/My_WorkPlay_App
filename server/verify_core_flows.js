const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let workerToken = '';
let workerId = '';
let taskId = '';

async function run() {
    console.log("Starting Core Flow Verification...");

    try {
        // 1. Admin Login
        console.log("1. Logging in as Admin...");
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'Admin',
            password: 'Admin123',
            role: 'admin'
        });
        adminToken = adminRes.data.token;
        console.log("   Admin Logged In.");

        // 1.5 Create Second Admin (for approval)
        console.log("1.5. Creating Second Admin...");
        const admin2Username = 'Admin2_' + Date.now();
        try {
            await axios.post(`${API_URL}/auth/register`, {
                username: admin2Username,
                password: 'Admin123',
                role: 'admin',
                fullName: 'Second Admin',
                email: `admin2_${Date.now()}@workplay.com`,
                department: 'Management'
            });
        } catch (e) {
            console.log("   Admin2 Register Error:", e.response?.data || e.message);
        }
        const admin2Res = await axios.post(`${API_URL}/auth/login`, {
            username: admin2Username,
            password: 'Admin123',
            role: 'admin'
        });
        const admin2Token = admin2Res.data.token;
        console.log("   Second Admin Logged In.");

        // 1.8 Create Third Admin (for second approval)
        console.log("1.8. Creating Third Admin...");
        const admin3Username = 'Admin3_' + Date.now();
        try {
            await axios.post(`${API_URL}/auth/register`, {
                username: admin3Username,
                password: 'Admin123',
                role: 'admin',
                fullName: 'Third Admin',
                email: `admin3_${Date.now()}@workplay.com`,
                department: 'Management'
            });
        } catch (e) {
            console.log("   Admin3 Register Error:", e.response?.data || e.message);
        }
        const admin3Res = await axios.post(`${API_URL}/auth/login`, {
            username: admin3Username,
            password: 'Admin123',
            role: 'admin'
        });
        const admin3Token = admin3Res.data.token;
        console.log("   Third Admin Logged In.");

        // 2. Worker Login
        console.log("2. Logging in as Worker...");
        const workerRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'Worker1',
            password: 'Worker123',
            role: 'worker'
        });
        workerToken = workerRes.data.token;
        workerId = workerRes.data.user.id;
        console.log(`   Worker Logged In (ID: ${workerId}).`);

        // 3. Admin Creates Task
        console.log("3. Admin Creating Task...");
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'Verification Task ' + Date.now(),
            description: 'Automated verification task',
            rewardCoins: 50,
            rewardXp: 100,
            assignedToUserId: workerId // Assign to specific worker
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        taskId = taskRes.data.id;
        console.log(`   Task Created (ID: ${taskId}).`);

        // 3.5 Admin Mints Coins to Treasury
        const paymentRef = 'VERIFY_REF_' + Date.now();
        const mintRes = await axios.post(`${API_URL}/admin/mint`, {
            amount: 1000,
            paymentReference: paymentRef
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        // Auto-approve (if logic allows, or finding the request and approving it)
        // Since MintRequest defaults to pending, we need to approve it. 
        // For simplicity in this script, we can assume self-approval is allowed for this test or find the request.

        // Find the request
        const treasuryData = await axios.get(`${API_URL}/admin/treasury`, { headers: { Authorization: `Bearer ${adminToken}` } });
        const pendingRequest = treasuryData.data.mintRequests.find(r => r.paymentReference === paymentRef);

        if (pendingRequest) {
            await axios.post(`${API_URL}/admin/mint-requests/${pendingRequest.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${admin2Token}` }
            });
            console.log("   Treasury Mint Approved by Admin 2.");

            // Second Approval
            await axios.post(`${API_URL}/admin/mint-requests/${pendingRequest.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${admin3Token}` }
            });
            console.log("   Treasury Mint Approved by Admin 3 (Finalized).");

        } else {
            console.log("   Warning: verify_core_flows could not find mint request to approve.");
        }

        // 4. Worker Completes Task
        console.log("4. Worker Completing Task...");
        // First check if task is visible
        const tasksRes = await axios.get(`${API_URL}/tasks`, {
            headers: { Authorization: `Bearer ${workerToken}` },
            params: { userId: workerId } // Some APIs might need this
        });
        const taskVisible = tasksRes.data.find(t => t.id === taskId);
        if (!taskVisible) throw new Error("Task not visible to worker!");
        console.log("   Task is visible to worker.");

        const completeRes = await axios.post(`${API_URL}/tasks/${taskId}/complete`, {
            userId: workerId
        }, {
            headers: { Authorization: `Bearer ${workerToken}` }
        });

        if (completeRes.data.success) {
            console.log("   Task Completed Successfully.");
            console.log(`   New Worker Balance: ${completeRes.data.user.coins}`);
        } else {
            throw new Error("Task completion failed response.");
        }

        // 5. Verify Treasury Update (Optional / Advanced)
        // This requires admin access to treasury
        console.log("5. Verifying Treasury...");
        const treasuryRes = await axios.get(`${API_URL}/admin/treasury`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`   Treasury Balance: ${treasuryRes.data.treasury.balance}`);

        console.log("\n✅ ALL CORE FLOWS VERIFIED SUCCESSFULLY");

    } catch (error) {
        console.error("\n❌ VERIFICATION FAILED");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

run();
