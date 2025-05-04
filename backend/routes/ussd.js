const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Session storage (in production, use Redis)
const sessions = new Map();

/**
 * @route   POST /api/ussd
 * @desc    Handle USSD requests from Africa's Talking
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { sessionId, serviceCode, phoneNumber, text } = req.body;

        // Log USSD interaction
        await db.query(`
            INSERT INTO sms_logs (phone_number, message_type, direction, message_content, session_id)
            VALUES (?, 'ussd', 'inbound', ?, ?)
        `, [phoneNumber, text, sessionId]);

        let response = '';

        if (text === '') {
            // Main menu
            response = `CON Welcome to HealthQueue
1. Book Appointment
2. Check Queue Position
3. Cancel Appointment
4. My Appointments`;

        } else if (text === '1') {
            // Book Appointment - Show hospitals
            const [hospitals] = await db.query('SELECT id, name FROM hospitals WHERE is_active = TRUE ORDER BY name LIMIT 10');
            
            response = 'CON Select Hospital:\n';
            hospitals.forEach((h, i) => {
                response += `${i + 1}. ${h.name}\n`;
            });

            // Store hospitals in session
            sessions.set(sessionId, { step: 'select_hospital', hospitals });

        } else if (text.startsWith('1*')) {
            const parts = text.split('*');
            
            if (parts.length === 2) {
                // Hospital selected, show departments
                const session = sessions.get(sessionId);
                const hospitalIndex = parseInt(parts[1]) - 1;
                
                if (session && session.hospitals && session.hospitals[hospitalIndex]) {
                    const hospital = session.hospitals[hospitalIndex];
                    
                    const [departments] = await db.query(
                        'SELECT id, name FROM departments WHERE hospital_id = ? AND is_active = TRUE ORDER BY name',
                        [hospital.id]
                    );

                    response = 'CON Select Department:\n';
                    departments.forEach((d, i) => {
                        response += `${i + 1}. ${d.name}\n`;
                    });

                    session.selectedHospital = hospital;
                    session.departments = departments;
                    session.step = 'select_department';
                    sessions.set(sessionId, session);
                } else {
                    response = 'END Invalid selection. Please try again.';
                }

            } else if (parts.length === 3) {
                // Department selected, show available dates
                const session = sessions.get(sessionId);
                const deptIndex = parseInt(parts[2]) - 1;

                if (session && session.departments && session.departments[deptIndex]) {
                    const department = session.departments[deptIndex];

                    // Generate next 5 available dates
                    const dates = [];
                    const today = new Date();
                    for (let i = 1; i <= 5; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        dates.push(date.toISOString().split('T')[0]);
                    }

                    response = 'CON Select Date:\n';
                    dates.forEach((d, i) => {
                        const displayDate = new Date(d).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        response += `${i + 1}. ${displayDate}\n`;
                    });

                    session.selectedDepartment = department;
                    session.availableDates = dates;
                    session.step = 'select_date';
                    sessions.set(sessionId, session);
                } else {
                    response = 'END Invalid selection. Please try again.';
                }

            } else if (parts.length === 4) {
                // Date selected, show time slots
                const session = sessions.get(sessionId);
                const dateIndex = parseInt(parts[3]) - 1;

                if (session && session.availableDates && session.availableDates[dateIndex]) {
                    const selectedDate = session.availableDates[dateIndex];

                    // Get available time slots
                    const [doctors] = await db.query(
                        'SELECT start_time, end_time, appointment_duration FROM doctors WHERE department_id = ? AND is_active = TRUE LIMIT 1',
                        [session.selectedDepartment.id]
                    );

                    if (doctors.length > 0) {
                        const doctor = doctors[0];
                        const timeSlots = generateTimeSlots(
                            doctor.start_time, 
                            doctor.end_time, 
                            doctor.appointment_duration
                        );

                        // Show first 5 slots
                        response = 'CON Select Time:\n';
                        timeSlots.slice(0, 5).forEach((slot, i) => {
                            response += `${i + 1}. ${slot}\n`;
                        });

                        session.selectedDate = selectedDate;
                        session.timeSlots = timeSlots;
                        session.step = 'select_time';
                        sessions.set(sessionId, session);
                    } else {
                        response = 'END No available slots. Please try again later.';
                    }
                } else {
                    response = 'END Invalid selection. Please try again.';
                }

            } else if (parts.length === 5) {
                // Time selected, confirm and create appointment
                const session = sessions.get(sessionId);
                const timeIndex = parseInt(parts[4]) - 1;

                if (session && session.timeSlots && session.timeSlots[timeIndex]) {
                    const selectedTime = session.timeSlots[timeIndex];

                    // Create appointment
                    const result = await createAppointment({
                        phoneNumber,
                        hospitalId: session.selectedHospital.id,
                        departmentId: session.selectedDepartment.id,
                        date: session.selectedDate,
                        time: selectedTime
                    });

                    if (result.success) {
                        response = `END ✓ Appointment Booked!
Hospital: ${session.selectedHospital.name}
Dept: ${session.selectedDepartment.name}
Date: ${session.selectedDate}
Time: ${selectedTime}
Number: ${result.appointmentNumber}
Queue: Position ${result.queuePosition}

SMS confirmation sent.`;
                    } else {
                        response = 'END Error booking appointment. Please try again.';
                    }

                    // Clear session
                    sessions.delete(sessionId);
                } else {
                    response = 'END Invalid selection. Please try again.';
                }
            }

        } else if (text === '2') {
            // Check Queue Position - Ask for appointment number
            response = 'CON Enter your appointment number:';
            sessions.set(sessionId, { step: 'check_queue' });

        } else if (text.startsWith('2*')) {
            // User entered appointment number
            const appointmentNumber = text.split('*')[1].toUpperCase();

            const [appointments] = await db.query(`
                SELECT 
                    a.appointment_number,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    h.name as hospital_name,
                    d.name as department_name,
                    qt.current_position,
                    qt.estimated_wait_minutes
                FROM appointments a
                JOIN hospitals h ON a.hospital_id = h.id
                JOIN departments d ON a.department_id = d.id
                LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
                WHERE a.appointment_number = ?
            `, [appointmentNumber]);

            if (appointments.length > 0) {
                const apt = appointments[0];
                response = `END Appointment: ${apt.appointment_number}
${apt.hospital_name}
${apt.department_name}

Date: ${apt.appointment_date}
Time: ${apt.appointment_time}
Status: ${apt.status}

${apt.current_position ? `Queue Position: ${apt.current_position}
Est. Wait: ${apt.estimated_wait_minutes} min` : 'Not in queue yet'}`;
            } else {
                response = 'END Appointment not found. Please check the number.';
            }

            sessions.delete(sessionId);

        } else if (text === '3') {
            // Cancel Appointment
            response = 'CON Enter appointment number to cancel:';
            sessions.set(sessionId, { step: 'cancel_appointment' });

        } else if (text.startsWith('3*')) {
            const appointmentNumber = text.split('*')[1].toUpperCase();

            const [result] = await db.query(`
                UPDATE appointments 
                SET status = 'cancelled', cancelled_at = NOW()
                WHERE appointment_number = ?
                AND status IN ('scheduled', 'checked_in')
            `, [appointmentNumber]);

            if (result.affectedRows > 0) {
                response = `END ✓ Appointment ${appointmentNumber} cancelled successfully.`;
            } else {
                response = 'END Unable to cancel. Appointment not found or already processed.';
            }

            sessions.delete(sessionId);

        } else if (text === '4') {
            // My Appointments
            const [appointments] = await db.query(`
                SELECT 
                    a.appointment_number,
                    a.appointment_date,
                    a.appointment_time,
                    a.status,
                    h.name as hospital_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN hospitals h ON a.hospital_id = h.id
                WHERE p.phone = ?
                AND a.status IN ('scheduled', 'checked_in')
                ORDER BY a.appointment_date, a.appointment_time
                LIMIT 5
            `, [phoneNumber]);

            if (appointments.length > 0) {
                response = 'END Your Appointments:\n\n';
                appointments.forEach(apt => {
                    response += `${apt.appointment_number}
${apt.hospital_name}
${apt.appointment_date} ${apt.appointment_time}
Status: ${apt.status}\n\n`;
                });
            } else {
                response = 'END You have no upcoming appointments.';
            }

        } else {
            response = 'END Invalid input. Please try again by dialing ' + serviceCode;
        }

        // Log outbound response
        await db.query(`
            INSERT INTO sms_logs (phone_number, message_type, direction, message_content, session_id)
            VALUES (?, 'ussd', 'outbound', ?, ?)
        `, [phoneNumber, response, sessionId]);

        res.set('Content-Type', 'text/plain');
        res.send(response);

    } catch (error) {
        console.error('USSD Error:', error);
        res.set('Content-Type', 'text/plain');
        res.send('END An error occurred. Please try again later.');
    }
});

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, duration) {
    const slots = [];
    let current = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    while (current < end) {
        slots.push(current.toTimeString().slice(0, 5));
        current = new Date(current.getTime() + duration * 60000);
    }

    return slots;
}

// Helper function to create appointment
async function createAppointment({ phoneNumber, hospitalId, departmentId, date, time }) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get or create patient
        let [patients] = await connection.query(
            'SELECT id, name FROM patients WHERE phone = ?',
            [phoneNumber]
        );

        let patientId, patientName;
        if (patients.length === 0) {
            const [result] = await connection.query(
                'INSERT INTO patients (phone, name) VALUES (?, ?)',
                [phoneNumber, 'USSD User']
            );
            patientId = result.insertId;
            patientName = 'USSD User';
        } else {
            patientId = patients[0].id;
            patientName = patients[0].name;
        }

        // Get queue position
        const [queueData] = await connection.query(`
            SELECT COALESCE(MAX(queue_position), 0) + 1 as next_position
            FROM appointments
            WHERE hospital_id = ? AND department_id = ? AND appointment_date = ?
            AND status IN ('scheduled', 'checked_in')
        `, [hospitalId, departmentId, date]);

        const queuePosition = queueData[0].next_position;

        // Create appointment
        const [result] = await connection.query(`
            INSERT INTO appointments (
                patient_id, hospital_id, department_id,
                appointment_date, appointment_time, queue_position,
                booking_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'ussd', 'scheduled')
        `, [patientId, hospitalId, departmentId, date, time, queuePosition]);

        // Get appointment number
        const [newApt] = await connection.query(
            'SELECT appointment_number FROM appointments WHERE id = ?',
            [result.insertId]
        );

        await connection.commit();

        return {
            success: true,
            appointmentNumber: newApt[0].appointment_number,
            queuePosition
        };

    } catch (error) {
        await connection.rollback();
        console.error('Error creating appointment:', error);
        return { success: false };
    } finally {
        connection.release();
    }
}

module.exports = router;
