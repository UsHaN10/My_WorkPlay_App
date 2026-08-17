const express = require('express');
const router = express.Router();
const { JOB_ROLES, SKILL_TREES, getAllSkills } = require('../config/skills');
const { authenticateToken } = require('../middleware/auth');

router.get('/config', authenticateToken, (req, res) => {
    res.json({
        jobRoles: JOB_ROLES,
        skillTrees: SKILL_TREES,
        allSkills: getAllSkills()
    });
});

module.exports = router;
