const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); // Import http module
const { sequelize, Treasury } = require('./models');
const { initSocket } = require('./socket'); // Import socket init

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP Server
const httpServer = http.createServer(app);

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} from ${req.headers.origin}`);
    next();
});

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/admin', require('./routes/treasury'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/exchange'));
app.use('/api', require('./routes/analytics'));
app.use('/api/skills', require('./routes/skills'));

// Sync DB and Start Server
sequelize.sync().then(async () => {
    console.log('Database synced');

    try {
        const [treasury] = await Treasury.findOrCreate({ where: { id: 1 }, defaults: { balance: 0 } });
        console.log(`Treasury Balance: ${treasury.balance}`);
    } catch (err) {
        console.error("Treasury init error:", err);
    }

    // Use httpServer.listen instead of app.listen
    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

