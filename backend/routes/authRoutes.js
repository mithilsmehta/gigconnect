import express from 'express';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  register,
  login,
  me,
  // uploadResumeOnly,
  updateBasicProfile,
  sendNewEmailOtp,
  verifyNewEmailOtp,
  getUserProfile,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendEmailOtp, verifyEmailOtp } from '../controllers/authController.js';
import User from '../models/User.js';

const router = express.Router();

// ✅ Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Invalid file type'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Standard Routes
router.post('/send-otp', sendEmailOtp);
router.post('/verify-otp', verifyEmailOtp);
// Test endpoint
router.post('/test', (req, res) => {
  console.log('TEST ENDPOINT HIT');
  res.json({ success: true, message: 'Test successful' });
});

// Super simple registration for submission
router.post('/register', async (req, res) => {
  try {
    console.log('SIMPLE REGISTRATION HIT');
    const { firstName, lastName, email, password, role, phone, hourlyRate } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // Check if user exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone ? String(phone).replace(/\D/g, '') : '',
      hourlyRate: role === 'freelancer' ? parseFloat(hourlyRate) || 0 : 0,
      isVerified: true,
    });

    await user.save();
    console.log('User created:', user._id);

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/user/:userId', requireAuth, getUserProfile);
// router.post("/upload-resume", upload.single("resume"), uploadResumeOnly);

// ✅ GOOGLE LOGIN
router.post('/check-user', async (req, res) => {
  const { email } = req.body;
  const u = await User.findOne({ email });
  return res.json({ exists: !!u });
});

// ✅ UPDATE ROLE (for new Google users)
router.patch('/update-role', requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'freelancer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'Role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Update Role Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
});

// ✅ NEW PROFILE UPDATE API (for name/phone/country/about/skills)
router.patch('/update-basic', requireAuth, updateBasicProfile);

// ✅ NEW EMAIL CHANGE APIs
router.post('/email-change/send-otp', requireAuth, sendNewEmailOtp);
router.post('/email-change/verify-otp', requireAuth, verifyNewEmailOtp);
// Email change confirmation endpoint
router.post('/email-change/confirm', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // check old password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect old password' });
    }

    // everything is valid → update email
    user.email = newEmail;
    await user.save();

    return res.json({ success: true, message: 'Email updated successfully' });
  } catch (err) {
    console.error('Email change confirmation error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;

// File upload endpoint for messages
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});
