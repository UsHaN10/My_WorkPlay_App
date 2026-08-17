const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');
const { JOB_ROLES } = require('../config/skills');

// Register
router.post('/register', async (req, res) => {
    try {
        const username = req.body.username?.trim();
        const password = req.body.password?.trim();
        const { role, fullName, email, jobRole } = req.body;
        const department = 'Production Department';

        if (jobRole && !JOB_ROLES.includes(jobRole)) {
            return res.status(400).json({ error: 'Invalid Job Role selected.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let isVIP = false;
        if (role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount >= 10) {
                return res.status(403).json({ error: 'Admin limit reached (Max 10). Contact existing admins.' });
            }
            if (adminCount === 0) {
                isVIP = true; // First admin is automatically a VIP
            }
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password: hashedPassword,
            role,
            isVIP,
            fullName,
            email,
            department,
            jobRole,
            skillLevels: {} // Initialize empty skills
        });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, isVIP: user.isVIP }, JWT_SECRET, { expiresIn: '72h' });
        res.json({ user, token });
    } catch (err) {
        console.error("Registration Error:", err);
        const fs = require('fs');
        const errLog = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        try {
            fs.appendFileSync(__dirname + '/../register_error.log', new Date().toISOString() + ': ' + errLog + '\n----------------\n');
        } catch (fse) { console.error('Failed to write log', fse); }

        if (err.name === 'SequelizeUniqueConstraintError') {
            const field = err.errors ? err.errors[0].path : 'Field';
            return res.status(400).json({ error: `${field} already exists.` });
        }
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Validation Error', details: err.errors ? err.errors.map(e => e.message) : err.message });
        }
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const username = req.body.username?.trim();
        const password = req.body.password?.trim();
        const { role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        console.log(`Login attempt: "${username}" as ${role}. Password Length: ${password.length}`);

        // Find user by username only first to check role mismatch (case-insensitive)
        let user = await User.findOne({ where: { username: username.toLowerCase() } });

        if (!user) {
            console.log(`User not found: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.role !== role) {
            console.log(`Role mismatch for ${username}: ${user.role} vs ${role}`);
            return res.status(401).json({
                error: `Role mismatch. This account is an ${user.role}.`,
                roleMismatch: true,
                actualRole: user.role
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Password mismatch for user: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, isVIP: user.isVIP }, JWT_SECRET, { expiresIn: '72h' });
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
