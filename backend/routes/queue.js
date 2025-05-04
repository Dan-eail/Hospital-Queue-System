const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @route   GET /api/queue/:hospitalId/:departmentId
 * @desc    Get current queue for a department
 * @access  Public
 */
router.get('/:hospitalId/:departmentId', async (req, res) => {
    try {
        const { hospitalId, departmentId } = req.params;
        const { date = new Date().toISOString().split('T')[0] } = req.query;

        const [queue] = await db.query(`
            SELECT 
                a.appointment_number,
                a.appointment_time,
                a.status,
                p.name as patient_name,
                p.phone as patient_phone,
                qt.current_position,
                qt.estimated_wait_minutes,
                a.checked_in_at
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
            WHERE a.hospital_id = ?
            AND a.department_id = ?
            AND a.appointment_date = ?
            AND a.status IN ('scheduled', 'checked_in', 'in_progress')
            ORDER BY qt.current_position
        `, [hospitalId, departmentId, date]);

        // Get statistics
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_in_queue,
                AVG(qt.estimated_wait_minutes) as avg_wait_time,
                SUM(CASE WHEN a.status = 'checked_in' THEN 1 ELSE 0 END) as checked_in_count,
                SUM(CASE WHEN a.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
            FROM appointments a
            LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
            WHERE a.hospital_id = ?
            AND a.department_id = ?
            AND a.appointment_date = ?
            AND a.status IN ('scheduled', 'checked_in', 'in_progress')
        `, [hospitalId, departmentId, date]);

        res.json({
            success: true,
            data: {
                queue,
                statistics: stats[0]
            }
        });

    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching queue'
        });
    }
});

module.exports = router;
