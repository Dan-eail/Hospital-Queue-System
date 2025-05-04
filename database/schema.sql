-- Hospital Queue & Appointment System Database Schema
-- Optimized with proper indexing and relationships

-- ============================================
-- CORE TABLES
-- ============================================

CREATE DATABASE IF NOT EXISTS hospital_queue_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE hospital_queue_db;

-- Hospitals
CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_location (location),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Departments
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    avg_consultation_time INT DEFAULT 30 COMMENT 'Average time in minutes',
    max_daily_appointments INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Doctors
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(255),
    available_days SET('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT 'Monday,Tuesday,Wednesday,Thursday,Friday',
    start_time TIME DEFAULT '08:00:00',
    end_time TIME DEFAULT '17:00:00',
    appointment_duration INT DEFAULT 30 COMMENT 'Minutes per appointment',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_department (department_id),
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Patients
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    email VARCHAR(255),
    address TEXT,
    emergency_contact VARCHAR(20),
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_phone (phone),
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Appointments
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_number VARCHAR(10) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    hospital_id INT NOT NULL,
    department_id INT NOT NULL,
    doctor_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    queue_position INT,
    status ENUM('scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    booking_method ENUM('ussd', 'sms', 'web', 'walk_in') DEFAULT 'web',
    reason_for_visit TEXT,
    notes TEXT,
    estimated_wait_minutes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    
    INDEX idx_appointment_number (appointment_number),
    INDEX idx_patient (patient_id),
    INDEX idx_hospital_date (hospital_id, appointment_date),
    INDEX idx_department_date (department_id, appointment_date),
    INDEX idx_doctor_date (doctor_id, appointment_date),
    INDEX idx_status (status),
    INDEX idx_date_time (appointment_date, appointment_time),
    INDEX idx_queue (hospital_id, department_id, appointment_date, queue_position)
) ENGINE=InnoDB;

-- Real-time Queue Tracking
CREATE TABLE queue_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    department_id INT NOT NULL,
    current_position INT NOT NULL,
    estimated_wait_minutes INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    
    INDEX idx_appointment (appointment_id),
    INDEX idx_hospital_dept (hospital_id, department_id),
    INDEX idx_position (current_position)
) ENGINE=InnoDB;

-- Users (Staff Authentication)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'receptionist', 'moh_staff') NOT NULL,
    hospital_id INT,
    department_id INT,
    doctor_id INT,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- SMS/USSD Logs
CREATE TABLE sms_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message_type ENUM('sms', 'ussd') NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_content TEXT,
    session_id VARCHAR(100),
    status ENUM('sent', 'delivered', 'failed') DEFAULT 'sent',
    appointment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_phone (phone_number),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    type ENUM('reminder', 'confirmation', 'delay', 'cancellation', 'ready') NOT NULL,
    channel ENUM('sms', 'email', 'push') NOT NULL,
    recipient_phone VARCHAR(20),
    recipient_email VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    INDEX idx_appointment (appointment_id),
    INDEX idx_status (status),
    INDEX idx_scheduled (scheduled_for)
) ENGINE=InnoDB;

-- Analytics & Reporting
CREATE TABLE appointment_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    department_id INT NOT NULL,
    date DATE NOT NULL,
    total_appointments INT DEFAULT 0,
    completed_appointments INT DEFAULT 0,
    cancelled_appointments INT DEFAULT 0,
    no_shows INT DEFAULT 0,
    avg_wait_time_minutes INT DEFAULT 0,
    avg_consultation_time_minutes INT DEFAULT 0,
    peak_hour TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_analytics (hospital_id, department_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- ============================================
-- TRIGGERS FOR AUTOMATION
-- ============================================

-- Auto-update queue positions when appointment status changes
DELIMITER //
CREATE TRIGGER after_appointment_status_update
AFTER UPDATE ON appointments
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status AND (NEW.status = 'completed' OR NEW.status = 'cancelled' OR NEW.status = 'no_show') THEN
        -- Remove from queue tracking
        DELETE FROM queue_tracking WHERE appointment_id = NEW.id;
        
        -- Update positions for remaining appointments
        UPDATE queue_tracking qt
        JOIN appointments a ON qt.appointment_id = a.id
        SET qt.current_position = qt.current_position - 1
        WHERE qt.hospital_id = NEW.hospital_id
        AND qt.department_id = NEW.department_id
        AND a.appointment_date = NEW.appointment_date
        AND qt.current_position > OLD.queue_position;
    END IF;
END//

-- Auto-generate appointment number
CREATE TRIGGER before_appointment_insert
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        SET NEW.appointment_number = CONCAT('A', LPAD(FLOOR(RAND() * 999999), 6, '0'));
    END IF;
END//

DELIMITER ;

-- ============================================
-- INDEXES FOR OPTIMIZATION
-- ============================================

-- Composite indexes for common queries
CREATE INDEX idx_appointments_search ON appointments(hospital_id, department_id, appointment_date, status);
CREATE INDEX idx_queue_active ON appointments(hospital_id, department_id, appointment_date, queue_position);
CREATE INDEX idx_today_appointments ON appointments(appointment_date, status);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active Queue View
CREATE OR REPLACE VIEW active_queue AS
SELECT 
    a.id,
    a.appointment_number,
    a.patient_id,
    p.name AS patient_name,
    p.phone AS patient_phone,
    a.hospital_id,
    h.name AS hospital_name,
    a.department_id,
    d.name AS department_name,
    a.doctor_id,
    doc.name AS doctor_name,
    a.appointment_date,
    a.appointment_time,
    a.queue_position,
    a.status,
    qt.current_position,
    qt.estimated_wait_minutes,
    a.checked_in_at
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN hospitals h ON a.hospital_id = h.id
JOIN departments d ON a.department_id = d.id
LEFT JOIN doctors doc ON a.doctor_id = doc.id
LEFT JOIN queue_tracking qt ON a.id = qt.appointment_id
WHERE a.status IN ('scheduled', 'checked_in', 'in_progress')
AND a.appointment_date >= CURDATE();

-- Daily Statistics View
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
    h.id AS hospital_id,
    h.name AS hospital_name,
    d.id AS department_id,
    d.name AS department_name,
    a.appointment_date,
    COUNT(*) AS total_appointments,
    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN a.status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
    SUM(CASE WHEN a.status = 'checked_in' THEN 1 ELSE 0 END) AS checked_in,
    SUM(CASE WHEN a.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
    SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_shows,
    AVG(CASE WHEN a.status = 'completed' THEN TIMESTAMPDIFF(MINUTE, a.checked_in_at, a.completed_at) END) AS avg_wait_minutes
FROM appointments a
JOIN hospitals h ON a.hospital_id = h.id
JOIN departments d ON a.department_id = d.id
GROUP BY h.id, d.id, a.appointment_date;
