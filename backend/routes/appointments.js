const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const {
            hospital_id,
            department_id,
            doctor_id,
            patient_phone,
            date,
            status,
            page = 1,
            limit = 50
        } = req.query;

        let query = `
            SELECT 
                a.*,
                p.name as patient_name,
                p.phone as patient_phone,
                h.name as hospital_name,
                d.name as department_name,
                doc.name as doctor_name,
                qt.current_position,
                qt.estimated_wait_minutes
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN hospitals h ON a.hospital_id = h.id
            JOIN departments d ON a.department_id = d.id
            LEFT JOIN doctors doc ON a.doctor_id = doc.id
            LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
            WHERE 1=1
        `;

        const params = [];

        if (hospital_id) {
            query += ' AND a.hospital_id = ?';
            params.push(hospital_id);
        }
        if (department_id) {
            query += ' AND a.department_id = ?';
            params.push(department_id);
        }
        if (doctor_id) {
            query += ' AND a.doctor_id = ?';
            params.push(doctor_id);
        }
        if (patient_phone) {
            query += ' AND p.phone = ?';
            params.push(patient_phone);
        }
        if (date) {
            query += ' AND a.appointment_date = ?';
            params.push(date);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const [appointments] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE 1=1';
        const countParams = [];
        
        if (hospital_id) { countQuery += ' AND a.hospital_id = ?'; countParams.push(hospital_id); }
        if (department_id) { countQuery += ' AND a.department_id = ?'; countParams.push(department_id); }
        if (doctor_id) { countQuery += ' AND a.doctor_id = ?'; countParams.push(doctor_id); }
        if (patient_phone) { countQuery += ' AND p.phone = ?'; countParams.push(patient_phone); }
        if (date) { countQuery += ' AND a.appointment_date = ?'; countParams.push(date); }
        if (status) { countQuery += ' AND a.status = ?'; countParams.push(status); }

        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            success: true,
            data: appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments'
        });
    }
});

/**
 * @route   GET /api/appointments/:appointmentNumber
 * @desc    Get appointment by appointment number
 * @access  Public
 */
router.get('/:appointmentNumber', async (req, res) => {
    try {
        const [appointments] = await db.query(`
            SELECT 
                a.*,
                p.name as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                h.name as hospital_name,
                h.location as hospital_location,
                d.name as department_name,
                doc.name as doctor_name,
                qt.current_position,
                qt.estimated_wait_minutes
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN hospitals h ON a.hospital_id = h.id
            JOIN departments d ON a.department_id = d.id
            LEFT JOIN doctors doc ON a.doctor_id = doc.id
            LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
            WHERE a.appointment_number = ?
        `, [req.params.appointmentNumber]);

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            data: appointments[0]
        });

    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment'
        });
    }
});

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Public
 */
router.post('/', [
    body('patient_phone').customSanitizer(value => value.replace(/\s+|-|\(|\)/g, '')).isMobilePhone('any').withMessage('Valid phone number required'),
    body('patient_name').notEmpty().withMessage('Patient name required'),
    body('hospital_id').isInt().withMessage('Valid hospital ID required'),
    body('department_id').isInt().withMessage('Valid department ID required'),
    body('appointment_date').isDate().withMessage('Valid date required'),
    body('appointment_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time required (HH:MM)')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            patient_phone,
            patient_name,
            hospital_id,
            department_id,
            doctor_id,
            appointment_date,
            appointment_time,
            reason_for_visit,
            booking_method = 'web'
        } = req.body;

        // Check if patient exists, create if not
        let [patients] = await connection.query(
            'SELECT id FROM patients WHERE phone = ?',
            [patient_phone]
        );

        let patient_id;
        if (patients.length === 0) {
            const [result] = await connection.query(
                'INSERT INTO patients (phone, name) VALUES (?, ?)',
                [patient_phone, patient_name]
            );
            patient_id = result.insertId;
        } else {
            patient_id = patients[0].id;
        }

        // Get next queue position
        const [queueData] = await connection.query(`
            SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position
            FROM appointments
            WHERE hospital_id = ?
            AND department_id = ?
            AND appointment_date = ?
            AND status IN ('scheduled', 'checked_in')
        `, [hospital_id, department_id, appointment_date]);

        const queue_position = queueData[0].next_position;

        // Create appointment
        const [appointmentResult] = await connection.query(`
            INSERT INTO appointments (
                patient_id, hospital_id, department_id, doctor_id,
                appointment_date, appointment_time, queue_position,
                booking_method, reason_for_visit, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
        `, [
            patient_id, hospital_id, department_id, doctor_id || null,
            appointment_date, appointment_time, queue_position,
            booking_method, reason_for_visit
        ]);

        // Get the created appointment with all details
        const [newAppointment] = await connection.query(`
            SELECT 
                a.*,
                p.name as patient_name,
                p.phone as patient_phone,
                h.name as hospital_name,
                d.name as department_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN hospitals h ON a.hospital_id = h.id
            JOIN departments d ON a.department_id = d.id
            WHERE a.id = ?
        `, [appointmentResult.insertId]);

        await connection.commit();

        // Send confirmation SMS
        const message = `Appointment confirmed! ${newAppointment[0].hospital_name}, ${newAppointment[0].department_name} on ${appointment_date} at ${appointment_time}. Your number: ${newAppointment[0].appointment_number}. Queue position: ${queue_position}`;
        
        await connection.query(`
            INSERT INTO notifications (appointment_id, type, channel, recipient_phone, message, scheduled_for)
            VALUES (?, 'confirmation', 'sms', ?, ?, NOW())
        `, [appointmentResult.insertId, patient_phone, message]);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`hospital-${hospital_id}-dept-${department_id}`).emit('new-appointment', {
            appointment: newAppointment[0]
        });

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: newAppointment[0]
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating appointment'
        });
    } finally {
        connection.release();
    }
});

/**
 * @route   PUT /api/appointments/:appointmentNumber/status
 * @desc    Update appointment status (check-in, start, complete, cancel)
 * @access  Staff
 */
router.put('/:appointmentNumber/status', [
    body('status').isIn(['checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { status } = req.body;
        const { appointmentNumber } = req.params;

        // Get current appointment
        const [appointments] = await db.query(
            'SELECT * FROM appointments WHERE appointment_number = ?',
            [appointmentNumber]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        const appointment = appointments[0];

        // Update status with timestamp
        let updateQuery = 'UPDATE appointments SET status = ?';
        const params = [status];

        if (status === 'checked_in') {
            updateQuery += ', checked_in_at = NOW()';
        } else if (status === 'in_progress') {
            updateQuery += ', started_at = NOW()';
        } else if (status === 'completed') {
            updateQuery += ', completed_at = NOW()';
        } else if (status === 'cancelled') {
            updateQuery += ', cancelled_at = NOW()';
        }

        updateQuery += ' WHERE appointment_number = ?';
        params.push(appointmentNumber);

        await db.query(updateQuery, params);

        // Emit real-time update
        const io = req.app.get('io');
        io.to(`hospital-${appointment.hospital_id}-dept-${appointment.department_id}`).emit('status-update', {
            appointmentNumber,
            status,
            timestamp: new Date()
        });

        io.to(`appointment-${appointmentNumber}`).emit('status-changed', {
            status,
            message: `Your appointment status is now: ${status.replace('_', ' ')}`
        });

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: { appointmentNumber, status }
        });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating status'
        });
    }
});

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available time slots for booking
 * @access  Public
 */
router.get('/available-slots/search', async (req, res) => {
    try {
        const { hospital_id, department_id, doctor_id, date } = req.query;

        if (!hospital_id || !department_id || !date) {
            return res.status(400).json({
                success: false,
                message: 'Hospital ID, Department ID, and Date are required'
            });
        }

        // Get doctor schedule
        let doctorQuery = `
            SELECT 
                d.id,
                d.start_time,
                d.end_time,
                d.appointment_duration
            FROM doctors d
            WHERE d.department_id = ?
            AND d.is_active = TRUE
        `;
        const doctorParams = [department_id];

        if (doctor_id) {
            doctorQuery += ' AND d.id = ?';
            doctorParams.push(doctor_id);
        }

        const [doctors] = await db.query(doctorQuery, doctorParams);

        if (doctors.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Generate time slots
        const slots = [];
        for (const doctor of doctors) {
            const startTime = doctor.start_time;
            const endTime = doctor.end_time;
            const duration = doctor.appointment_duration;

            // Get existing appointments
            const [existingApts] = await db.query(`
                SELECT appointment_time
                FROM appointments
                WHERE doctor_id = ?
                AND appointment_date = ?
                AND status NOT IN ('cancelled', 'no_show')
            `, [doctor.id, date]);

            const bookedTimes = existingApts.map(apt => apt.appointment_time);

            // Generate slots
            let current = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);

            while (current < end) {
                const timeStr = current.toTimeString().slice(0, 5);
                const isAvailable = !bookedTimes.includes(timeStr);

                slots.push({
                    time: timeStr,
                    available: isAvailable,
                    doctor_id: doctor.id
                });

                current = new Date(current.getTime() + duration * 60000);
            }
        }

        res.json({
            success: true,
            data: slots.filter(s => s.available)
        });

    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available slots'
        });
    }
});

module.exports = router;
