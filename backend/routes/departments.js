const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const { hospital_id } = req.query;
        let query = 'SELECT * FROM departments WHERE is_active = TRUE';
        const params = [];
        
        if (hospital_id) {
            query += ' AND hospital_id = ?';
            params.push(hospital_id);
        }
        
        query += ' ORDER BY name';
        const [departments] = await db.query(query, params);
        
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
});

module.exports = router;
