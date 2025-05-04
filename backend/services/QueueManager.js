const db = require('../config/database');
const logger = require('../utils/logger');
const cron = require('node-cron');

class QueueManager {
    constructor(io) {
        this.io = io;
        this.refreshInterval = null;
        this.reminderJob = null;
    }

    /**
     * Start queue management services
     */
    start() {
        logger.info('Starting Queue Manager...');
        
        // Refresh queue positions every 30 seconds
        this.startQueueRefresh();
        
        // Send appointment reminders (runs every minute)
        this.startReminderService();
        
        // Auto mark no-shows (runs every 5 minutes)
        this.startNoShowDetection();
        
        logger.info('Queue Manager started successfully');
    }

    /**
     * Stop all queue management services
     */
    stop() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.reminderJob) {
            this.reminderJob.stop();
        }
        logger.info('Queue Manager stopped');
    }

    /**
     * Refresh queue positions and estimated wait times
     */
    async refreshQueue() {
        try {
            const [appointments] = await db.query(`
                SELECT 
                    a.id,
                    a.appointment_number,
                    a.hospital_id,
                    a.department_id,
                    a.queue_position,
                    d.avg_consultation_time
                FROM appointments a
                JOIN departments d ON a.department_id = d.id
                WHERE a.status IN ('scheduled', 'checked_in')
                AND a.appointment_date = CURDATE()
                ORDER BY a.hospital_id, a.department_id, a.queue_position
            `);

            // Group by hospital and department
            const queuesByDept = {};
            
            appointments.forEach(apt => {
                const key = `${apt.hospital_id}-${apt.department_id}`;
                if (!queuesByDept[key]) {
                    queuesByDept[key] = [];
                }
                queuesByDept[key].push(apt);
            });

            // Update each queue
            for (const [key, queue] of Object.entries(queuesByDept)) {
                await this.updateQueuePositions(queue);
            }

        } catch (error) {
            logger.error('Error refreshing queue:', error);
        }
    }

    /**
     * Update queue positions and notify clients
     */
    async updateQueuePositions(queue) {
        for (let i = 0; i < queue.length; i++) {
            const appointment = queue[i];
            const newPosition = i + 1;
            const estimatedWait = newPosition * appointment.avg_consultation_time;

            try {
                // Update queue tracking
                await db.query(`
                    INSERT INTO queue_tracking (appointment_id, hospital_id, department_id, current_position, estimated_wait_minutes)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        current_position = VALUES(current_position),
                        estimated_wait_minutes = VALUES(estimated_wait_minutes),
                        last_updated = CURRENT_TIMESTAMP
                `, [
                    appointment.id,
                    appointment.hospital_id,
                    appointment.department_id,
                    newPosition,
                    estimatedWait
                ]);

                // Emit real-time update via WebSocket
                const room = `hospital-${appointment.hospital_id}-dept-${appointment.department_id}`;
                this.io.to(room).emit('queue-update', {
                    appointmentNumber: appointment.appointment_number,
                    position: newPosition,
                    estimatedWait
                });

                // Individual appointment tracking
                this.io.to(`appointment-${appointment.appointment_number}`).emit('position-update', {
                    position: newPosition,
                    estimatedWait,
                    peopleAhead: newPosition - 1
                });

                // Send SMS notification if position is 2 or less
                if (newPosition <= 2 && newPosition !== appointment.queue_position) {
                    await this.notifyPatientReady(appointment.appointment_number);
                }

            } catch (error) {
                logger.error(`Error updating queue position for appointment ${appointment.id}:`, error);
            }
        }
    }

    /**
     * Notify patient when their turn is coming up
     */
    async notifyPatientReady(appointmentNumber) {
        try {
            const [appointments] = await db.query(`
                SELECT a.*, p.phone, p.name, h.name as hospital_name
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN hospitals h ON a.hospital_id = h.id
                WHERE a.appointment_number = ?
            `, [appointmentNumber]);

            if (appointments.length > 0) {
                const apt = appointments[0];
                const message = `Your turn is coming up soon at ${apt.hospital_name}. Please arrive now. Appointment: ${appointmentNumber}`;
                
                // Queue SMS notification
                await db.query(`
                    INSERT INTO notifications (appointment_id, type, channel, recipient_phone, message, scheduled_for)
                    VALUES (?, 'ready', 'sms', ?, ?, NOW())
                `, [apt.id, apt.phone, message]);
            }
        } catch (error) {
            logger.error('Error sending ready notification:', error);
        }
    }

    /**
     * Start periodic queue refresh
     */
    startQueueRefresh() {
        const interval = parseInt(process.env.QUEUE_REFRESH_INTERVAL) || 30000;
        this.refreshInterval = setInterval(() => {
            this.refreshQueue();
        }, interval);
        
        // Initial refresh
        this.refreshQueue();
        
        logger.info(`Queue refresh started (every ${interval}ms)`);
    }

    /**
     * Send appointment reminders
     */
    startReminderService() {
        // Run every minute to check for upcoming appointments
        this.reminderJob = cron.schedule('* * * * *', async () => {
            try {
                // Find appointments scheduled for tomorrow
                const [tomorrowApts] = await db.query(`
                    SELECT a.*, p.phone, p.name, h.name as hospital_name, d.name as dept_name
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.id
                    JOIN hospitals h ON a.hospital_id = h.id
                    JOIN departments d ON a.department_id = d.id
                    WHERE a.status = 'scheduled'
                    AND a.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                    AND NOT EXISTS (
                        SELECT 1 FROM notifications n
                        WHERE n.appointment_id = a.id
                        AND n.type = 'reminder'
                        AND n.status = 'sent'
                    )
                `);

                for (const apt of tomorrowApts) {
                    const message = `Reminder: You have an appointment tomorrow at ${apt.hospital_name}, ${apt.dept_name} at ${apt.appointment_time}. Appointment #${apt.appointment_number}`;
                    
                    await db.query(`
                        INSERT INTO notifications (appointment_id, type, channel, recipient_phone, message, scheduled_for)
                        VALUES (?, 'reminder', 'sms', ?, ?, NOW())
                    `, [apt.id, apt.phone, message]);
                }

                logger.info(`Processed ${tomorrowApts.length} reminder notifications`);

            } catch (error) {
                logger.error('Error in reminder service:', error);
            }
        });

        logger.info('Reminder service started');
    }

    /**
     * Auto-mark appointments as no-show
     */
    startNoShowDetection() {
        cron.schedule('*/5 * * * *', async () => {
            try {
                const noShowMinutes = parseInt(process.env.AUTO_NO_SHOW_MINUTES) || 30;
                
                const [result] = await db.query(`
                    UPDATE appointments
                    SET status = 'no_show'
                    WHERE status = 'scheduled'
                    AND appointment_date = CURDATE()
                    AND TIMESTAMPDIFF(MINUTE, CONCAT(appointment_date, ' ', appointment_time), NOW()) > ?
                `, [noShowMinutes]);

                if (result.affectedRows > 0) {
                    logger.info(`Marked ${result.affectedRows} appointments as no-show`);
                }

            } catch (error) {
                logger.error('Error in no-show detection:', error);
            }
        });

        logger.info('No-show detection started');
    }

    /**
     * Get current queue status for a department
     */
    async getQueueStatus(hospitalId, departmentId, date = null) {
        const queryDate = date || new Date().toISOString().split('T')[0];
        
        const [queue] = await db.query(`
            SELECT 
                a.appointment_number,
                p.name as patient_name,
                a.appointment_time,
                a.status,
                qt.current_position,
                qt.estimated_wait_minutes
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
            WHERE a.hospital_id = ?
            AND a.department_id = ?
            AND a.appointment_date = ?
            AND a.status IN ('scheduled', 'checked_in', 'in_progress')
            ORDER BY qt.current_position
        `, [hospitalId, departmentId, queryDate]);

        return queue;
    }
}

module.exports = QueueManager;
