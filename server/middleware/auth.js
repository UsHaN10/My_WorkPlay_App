const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-very-secret-key-change-this-in-prod';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
};

const isVIPAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin' && req.user.isVIP) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. VIP Admin permission required.' });
    }
};

module.exports = { authenticateToken, isAdmin, isVIPAdmin, JWT_SECRET };
