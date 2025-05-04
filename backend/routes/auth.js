const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../utils/email');

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Check if a phone number belongs to a user or patient
 * @access  Public
 */
router.post('/verify-phone', [
    body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { phone } = req.body;
        const cleanPhone = phone.replace(/\s+|-|\(|\)/g, '');

        // Check users table first (Staff)
        const [users] = await db.query('SELECT id, full_name, role, phone FROM users WHERE phone = ? OR phone LIKE ?', [phone, `%${cleanPhone}%`]);
        
        if (users.length > 0) {
            return res.json({
                success: true,
                type: 'staff',
                user: {
                    name: users[0].full_name,
                    role: users[0].role
                }
            });
        }

        // Check patients table
        const [patients] = await db.query('SELECT id, name, phone FROM patients WHERE phone = ? OR phone LIKE ?', [phone, `%${cleanPhone}%`]);
        
        if (patients.length > 0) {
            return res.json({
                success: true,
                type: 'patient',
                user: {
                    name: patients[0].name
                }
            });
        }

        return res.status(404).json({
            success: false,
            message: 'No account found with this phone number'
        });

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

/**
 * @route   POST /api/auth/register/patient
 * @desc    Register a new patient
 * @access  Public
 */
router.post('/register/patient', [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, phone, password } = req.body;
        const cleanPhone = phone.replace(/\s+|-|\(|\)/g, '');

        // Check if patient exists
        const [existing] = await db.query('SELECT id FROM patients WHERE phone = ?', [cleanPhone]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Patient with this phone number already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create patient
        const [result] = await db.query(
            'INSERT INTO patients (name, phone, password_hash) VALUES (?, ?, ?)',
            [name, cleanPhone, password_hash]
        );

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            user: {
                id: result.insertId,
                name,
                phone: cleanPhone,
                type: 'patient'
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

/**
 * @route   POST /api/auth/register/hospital
 * @desc    Initialize hospital registration and send verification email
 * @access  Public
 */
router.post('/register/hospital', [
    body('hospitalName').notEmpty().withMessage('Hospital name is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    console.log('Hospital registration request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { hospitalName, location, adminName, email, password } = req.body;

        // Check if user or hospital email exists
        const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create hospital (inactive)
        const [hospResult] = await db.query(
            'INSERT INTO hospitals (name, location, phone, email, is_active) VALUES (?, ?, ?, ?, ?)',
            [hospitalName, location, 'TBD', email, false]
        );
        const hospitalId = hospResult.insertId;

        // Create admin user (inactive/unverified)
        await db.query(
            'INSERT INTO users (username, email, password_hash, role, hospital_id, full_name, verification_code, verification_expiry, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [email, email, password_hash, 'admin', hospitalId, adminName, verificationCode, verificationExpiry, false]
        );

        // Send verification email
        await sendEmail({
            to: email,
            subject: 'Verify Your Hospital Account - HealthQueue',
            text: `Welcome to HealthQueue, ${adminName}!\n\nYour verification code for ${hospitalName} is: ${verificationCode}\n\nThis code will expire in 30 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0d9488;">Welcome to HealthQueue!</h2>
                    <p>Hello <strong>${adminName}</strong>,</p>
                    <p>Thank you for registering <strong>${hospitalName}</strong>. Please use the verification code below to complete your registration:</p>
                    <div style="background: #f3f4f6; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 10px; margin: 20px 0;">
                        ${verificationCode}
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 30 minutes.</p>
                </div>
            `
        });

        res.status(201).json({
            success: true,
            message: 'Registration initialized. Please check your email for the verification code.',
            email
        });

    } catch (error) {
        console.error('Hospital registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

/**
 * @route   POST /api/auth/verify-hospital
 * @desc    Verify hospital registration with code
 * @access  Public
 */
router.post('/verify-hospital', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('code').notEmpty().withMessage('Verification code is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, code } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_expiry > NOW()',
            [email, code]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        const user = users[0];

        // Update user and hospital to active
        await db.query('UPDATE users SET is_active = 1, verification_code = NULL, verification_expiry = NULL WHERE id = ?', [user.id]);
        await db.query('UPDATE hospitals SET is_active = 1 WHERE id = ?', [user.hospital_id]);

        res.json({
            success: true,
            message: 'Account verified successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', [
    body('identifier').notEmpty().withMessage('Phone or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('type').isIn(['patient', 'staff']).withMessage('Invalid login type')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { identifier, password, type } = req.body;

        if (type === 'staff') {
            const [users] = await db.query('SELECT * FROM users WHERE (phone = ? OR email = ?) AND is_active = 1', [identifier, identifier]);
            
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid credentials or account not verified' });
            }

            const isMatch = await bcrypt.compare(password, users[0].password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const payload = {
                user: {
                    id: users[0].id,
                    role: users[0].role,
                    hospital_id: users[0].hospital_id,
                    type: 'staff'
                }
            };

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' }, (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: users[0].id,
                        name: users[0].full_name,
                        role: users[0].role,
                        type: 'staff'
                    }
                });
            });

        } else {
            // Patient login
            const cleanPhone = identifier.replace(/\s+|-|\(|\)/g, '');
            const [patients] = await db.query('SELECT * FROM patients WHERE phone = ?', [cleanPhone]);
            
            if (patients.length === 0) {
                return res.status(401).json({ success: false, message: 'Patient not found' });
            }

            if (patients[0].password_hash) {
                const isMatch = await bcrypt.compare(password, patients[0].password_hash);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
            }

            const payload = {
                user: {
                    id: patients[0].id,
                    type: 'patient'
                }
            };

            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: patients[0].id,
                        name: patients[0].name,
                        phone: patients[0].phone,
                        type: 'patient'
                    }
                });
            });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;
