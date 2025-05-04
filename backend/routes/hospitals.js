const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const { active_only = 'true' } = req.query;
        
        let query = 'SELECT * FROM hospitals';
        if (active_only === 'true') {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY name';

        const [hospitals] = await db.query(query);

        res.json({
            success: true,
            data: hospitals
        });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hospitals'
        });
    }
});

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get hospital details with departments
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const [hospitals] = await db.query(
            'SELECT * FROM hospitals WHERE id = ?',
            [req.params.id]
        );

        if (hospitals.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found'
            });
        }

        const [departments] = await db.query(
            'SELECT * FROM departments WHERE hospital_id = ? AND is_active = TRUE ORDER BY name',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...hospitals[0],
                departments
            }
        });
    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching hospital'
        });
    }
});

module.exports = router;
