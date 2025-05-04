const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function seedDatabase() {
  let connection;

  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_queue_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✓ Connected to database');

    // Clear existing data (optional - comment out in production)
    console.log('Clearing existing data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['notifications', 'sms_logs', 'queue_tracking', 'appointments', 
                    'patients', 'users', 'doctors', 'departments', 'hospitals'];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Cleared existing data');

    // Insert Hospitals
    console.log('Seeding hospitals...');
    const [hospitalsResult] = await connection.query(`
      INSERT INTO hospitals (name, location, phone, email, address, latitude, longitude) VALUES
      ('Tikur Anbessa Specialized Hospital', 'Addis Ababa, Lideta', '+251-11-551-6656', 'info@tikuranbessa.edu.et', 'Churchill Avenue, Addis Ababa', 9.0192, 38.7525),
      ('St. Paul''s Hospital Millennium Medical College', 'Addis Ababa, Gulele', '+251-11-551-0714', 'info@sphmmc.edu.et', 'Swaziland Street, Addis Ababa', 9.0447, 38.7636),
      ('Zewditu Memorial Hospital', 'Addis Ababa, Arada', '+251-11-551-3344', 'contact@zewditu.gov.et', 'Mexico Square, Addis Ababa', 9.0320, 38.7469),
      ('Alert Hospital', 'Addis Ababa, Kirkos', '+251-11-551-8800', 'info@alerthospital.org', 'Ras Desta Damtew Avenue', 9.0145, 38.7614)
    `);
    console.log(`✓ Inserted ${hospitalsResult.affectedRows} hospitals`);

    // Insert Departments
    console.log('Seeding departments...');
    const [deptsResult] = await connection.query(`
      INSERT INTO departments (hospital_id, name, description, avg_consultation_time, max_daily_appointments) VALUES
      (1, 'Cardiology', 'Heart and cardiovascular system', 30, 40),
      (1, 'Pediatrics', 'Children''s health and medicine', 20, 60),
      (1, 'General Medicine', 'General health consultations', 15, 80),
      (1, 'Orthopedics', 'Bone and joint conditions', 25, 50),
      (2, 'Emergency Medicine', 'Emergency and urgent care', 20, 100),
      (2, 'Obstetrics & Gynecology', 'Women''s health and pregnancy', 30, 45),
      (2, 'Neurology', 'Brain and nervous system', 35, 35),
      (3, 'Dermatology', 'Skin conditions', 20, 50),
      (3, 'ENT', 'Ear, Nose, and Throat', 25, 40),
      (4, 'Oncology', 'Cancer treatment and care', 40, 30),
      (4, 'Psychiatry', 'Mental health services', 45, 25)
    `);
    console.log(`✓ Inserted ${deptsResult.affectedRows} departments`);

    // Insert Doctors
    console.log('Seeding doctors...');
    const [doctorsResult] = await connection.query(`
      INSERT INTO doctors (department_id, name, specialization, license_number, phone, email, available_days, start_time, end_time, appointment_duration) VALUES
      (1, 'Dr. Abebe Kebede', 'Cardiologist', 'MED-ETH-2001', '+251-91-123-4567', 'abebe.kebede@tikur.edu.et', 'Monday,Tuesday,Wednesday,Thursday,Friday', '08:00:00', '17:00:00', 30),
      (2, 'Dr. Almaz Haile', 'Pediatrician', 'MED-ETH-2003', '+251-91-234-5678', 'almaz.haile@tikur.edu.et', 'Monday,Tuesday,Wednesday,Thursday,Friday', '08:00:00', '16:00:00', 20),
      (3, 'Dr. Dawit Solomon', 'General Practitioner', 'MED-ETH-2005', '+251-91-345-6789', 'dawit.solomon@tikur.edu.et', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', '07:00:00', '15:00:00', 15),
      (4, 'Dr. Tigist Bekele', 'Orthopedic Surgeon', 'MED-ETH-2007', '+251-91-456-7890', 'tigist.bekele@tikur.edu.et', 'Monday,Wednesday,Friday', '09:00:00', '17:00:00', 25),
      (5, 'Dr. Yohannes Tesfaye', 'Emergency Physician', 'MED-ETH-2010', '+251-91-567-8901', 'yohannes@sphmmc.edu.et', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', '00:00:00', '23:59:59', 20),
      (6, 'Dr. Sara Mengistu', 'OB-GYN', 'MED-ETH-2012', '+251-91-678-9012', 'sara.mengistu@sphmmc.edu.et', 'Monday,Tuesday,Wednesday,Thursday,Friday', '08:00:00', '18:00:00', 30),
      (7, 'Dr. Michael Assefa', 'Neurologist', 'MED-ETH-2015', '+251-91-789-0123', 'michael.assefa@sphmmc.edu.et', 'Tuesday,Thursday', '09:00:00', '16:00:00', 35)
    `);
    console.log(`✓ Inserted ${doctorsResult.affectedRows} doctors`);

    // Insert Sample Patients
    console.log('Seeding patients...');
    const [patientsResult] = await connection.query(`
      INSERT INTO patients (phone, name, date_of_birth, gender, email) VALUES
      ('+251-91-111-1111', 'Hana Tadesse', '1990-05-15', 'Female', 'hana.tadesse@email.com'),
      ('+251-91-222-2222', 'Samuel Girma', '1985-08-22', 'Male', 'samuel.g@email.com'),
      ('+251-91-333-3333', 'Marta Alemayehu', '1995-03-10', 'Female', 'marta.a@email.com'),
      ('+251-91-444-4444', 'Daniel Tesfaye', '1988-12-05', 'Male', 'daniel.t@email.com'),
      ('+251-91-555-5555', 'Yeshi Bekele', '1992-07-18', 'Female', 'yeshi.b@email.com')
    `);
    console.log(`✓ Inserted ${patientsResult.affectedRows} patients`);

    // Insert Sample Appointments for Today
    console.log('Seeding appointments...');
    const today = new Date().toISOString().split('T')[0];
    
    await connection.query(`
      INSERT INTO appointments (patient_id, hospital_id, department_id, doctor_id, appointment_date, appointment_time, queue_position, booking_method, status, reason_for_visit) VALUES
      (1, 1, 1, 1, ?, '09:00:00', 1, 'web', 'checked_in', 'Chest pain and irregular heartbeat'),
      (2, 1, 3, 3, ?, '09:30:00', 2, 'ussd', 'scheduled', 'General checkup'),
      (3, 2, 6, 6, ?, '10:00:00', 1, 'web', 'in_progress', 'Prenatal consultation'),
      (4, 1, 2, 2, ?, '10:30:00', 3, 'sms', 'scheduled', 'Child vaccination'),
      (5, 3, 8, NULL, ?, '11:00:00', 1, 'web', 'scheduled', 'Skin rash evaluation')
    `, [today, today, today, today, today]);
    
    console.log('✓ Inserted sample appointments');

    // Insert Queue Tracking
    console.log('Seeding queue tracking...');
    await connection.query(`
      INSERT INTO queue_tracking (appointment_id, hospital_id, department_id, current_position, estimated_wait_minutes)
      SELECT id, hospital_id, department_id, queue_position, queue_position * 15
      FROM appointments
      WHERE appointment_date = ? AND status IN ('scheduled', 'checked_in', 'in_progress')
    `, [today]);
    console.log('✓ Inserted queue tracking data');

    // Insert Sample Users (Staff)
    console.log('Seeding users...');
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await connection.query(`
      INSERT INTO users (username, email, password_hash, role, hospital_id, department_id, full_name, phone) VALUES
      ('admin', 'admin@healthqueue.et', ?, 'admin', NULL, NULL, 'System Administrator', '+251-91-000-0000'),
      ('tikur_reception', 'reception@tikur.edu.et', ?, 'receptionist', 1, NULL, 'Tikur Reception', '+251-91-000-0001'),
      ('dr.abebe', 'abebe.kebede@tikur.edu.et', ?, 'doctor', 1, 1, 'Dr. Abebe Kebede', '+251-91-123-4567')
    `, [passwordHash, passwordHash, passwordHash]);
    console.log('✓ Inserted users');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample Login Credentials:');
    console.log('- Username: admin | Password: password123');
    console.log('- Username: tikur_reception | Password: password123');
    console.log('- Username: dr.abebe | Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('\nSeed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
