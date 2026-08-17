const JOB_ROLES = [
    'Sewing Machine Operator',
    'Line Leader',
    'Production Supervisor',
    'Production Manager'
];

const SKILL_TREES = {
    'Sewing Machine Operator': {
        'Basic Skills': ['Garment Basics', 'Fabric Identification', 'Workplace Safety'],
        'Machine Skills': ['Machine Operation', 'Thread Setting', 'Machine Maintenance'],
        'Sewing Skills': ['Straight Stitch', 'Overlock', 'Seam Finishing'],
        'Quality Skills': ['Defect Identification', 'Self Inspection']
    },
    'Line Leader': {
        'Leadership': ['Team Coordination', 'Communication', 'Conflict Handling'],
        'Production': ['Production Planning', 'Work Allocation', 'Target Monitoring'],
        'Quality': ['Quality Inspection', 'Defect Analysis', 'Quality Control'],
        'Technical': ['Sewing Knowledge', 'Machine Knowledge', 'Production Process']
    },
    'Production Supervisor': {
        'Management': ['Team Management', 'Staff Scheduling', 'Performance Monitoring'],
        'Production': ['Production Planning', 'Target Management', 'Productivity Improvement'],
        'Quality': ['Quality Control', 'Root Cause Analysis', 'Defect Reduction'],
        'Problem Solving': ['Decision Making', 'Troubleshooting', 'Process Improvement']
    },
    'Production Manager': {
        'Strategic Management': ['Production Strategy', 'Capacity Planning', 'Resource Planning'],
        'Operations': ['Production Planning', 'Cost Control', 'Efficiency Management'],
        'Quality Management': ['Quality Assurance', 'Quality Improvement', 'Compliance'],
        'Leadership': ['Team Leadership', 'Decision Making', 'Performance Management']
    }
};

// Flatten skills for easy lookup
const getAllSkills = () => {
    let allSkills = [];
    Object.values(SKILL_TREES).forEach(categories => {
        Object.values(categories).forEach(skills => {
            allSkills = [...allSkills, ...skills];
        });
    });
    return Array.from(new Set(allSkills)); // Unique skills
};

module.exports = {
    JOB_ROLES,
    SKILL_TREES,
    getAllSkills
};
