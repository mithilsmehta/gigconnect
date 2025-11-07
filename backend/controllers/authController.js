// ======================= authController.js =======================
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

// temporary email → otp store (used also for email change)
let otpStore = {};

const PHONE_LIMITS = {
  India: 10,
  'United States': 10,
  Canada: 10,
  'United Kingdom': 10,
  Australia: 9,
  Germany: 11,
  France: 9,
  Japan: 10,
  Brazil: 11,
  'United Arab Emirates': 9,
  Other: 8,
};

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });

export const verifyRecaptcha = async (token) => {
  try {
    const secret = process.env.RECAPTCHA_SECRET;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    return data.success && (data.score || 0) > 0.3;
  } catch (err) {
    return false;
  }
};

/* ================= SEND OTP (REGISTER) ================= */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Account already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"GigConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verification Code',
      html: `<h1>${otp}</h1>`,
    });

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Failed OTP' });
  }
};

/* ================= VERIFY OTP (REGISTER) ================= */
export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp != otp) return res.status(400).json({ message: 'Invalid OTP' });
  delete otpStore[email];
  res.json({ success: true });
};

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  console.log('=== REGISTRATION STARTED ===');

  try {
    const { firstName, lastName, email, password, role, phone, hourlyRate, skills, about } = req.body;

    console.log('Basic data:', { firstName, lastName, email, role });

    // Simple validation
    if (!firstName || !lastName || !email || !password || !role) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Validation passed');

    // Create minimal user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone ? String(phone).replace(/\D/g, '') : '',
      hourlyRate: role === 'freelancer' ? parseFloat(hourlyRate) || 0 : 0,
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
      about: about || '',
      isVerified: true,
    });

    console.log('About to save user...');
    await user.save();
    console.log('User saved successfully!');

    return res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message,
    });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password, recaptchaToken } = req.body;
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) return res.status(400).json({ message: 'recaptcha failed' });

    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong credentials' });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        country: user.country,
        countryCode: user.countryCode,
      },
    });
  } catch {
    res.status(500).json({ message: 'Login error' });
  }
};

/* ================= PROFILE ME ================= */
export const me = async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  res.json({ success: true, user });
};

// ✅ UPDATE BASIC PROFILE
export const updateBasicProfile = async (req, res) => {
  try {
    const { firstName, lastName, about, skills, countryCode, phone, country, companyName, industry, hourlyRate } =
      req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.about = about || user.about;
    user.countryCode = countryCode || user.countryCode;
    user.phone = phone || user.phone;
    user.country = country || user.country;

    // Handle skills for freelancers
    if (skills !== undefined) {
      user.skills = Array.isArray(skills) ? skills : [];
    }

    // Handle hourly rate for freelancers
    if (hourlyRate !== undefined && user.role === 'freelancer') {
      user.hourlyRate = parseFloat(hourlyRate) || 0;
    }

    // Handle company fields for clients
    if (companyName !== undefined) {
      user.companyName = companyName;
    }
    if (industry !== undefined) {
      user.industry = industry;
    }

    await user.save();

    return res.json({ success: true, message: 'Profile updated!' });
  } catch (err) {
    console.error('Update Basic Profile Error:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// TEMP store for new email change
let emailChangeTemp = {};

// 1) send OTP to NEW email for change
export const sendNewEmailOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: 'Email required' });

    const exist = await User.findOne({ email: newEmail });
    if (exist) return res.status(400).json({ message: 'Email already in use' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    emailChangeTemp[req.userId] = { newEmail, otp, expires: Date.now() + 5 * 60 * 1000 };

    // send mail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"GigConnect" <${process.env.SMTP_USER}>`,
      to: newEmail,
      subject: 'Email Change OTP',
      html: `<h1>${otp}</h1><p>OTP valid 5 minutes</p>`,
    });

    return res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'error sending otp' });
  }
};

// 2) verify new email OTP
export const verifyNewEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const record = emailChangeTemp[req.userId];
    if (!record) return res.status(400).json({ message: 'No OTP found' });

    if (Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired' });
    if (parseInt(otp) !== record.otp) return res.status(400).json({ message: 'OTP wrong' });

    record.verified = true;
    return res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'error otp verify' });
  }
};

// 3) final update email after password check
export const confirmEmailChange = async (req, res) => {
  try {
    const { password } = req.body;
    const record = emailChangeTemp[req.userId];
    if (!record?.verified) return res.status(400).json({ message: 'OTP not verified' });

    const user = await User.findById(req.userId);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Password incorrect' });

    user.email = record.newEmail;
    await user.save();
    delete emailChangeTemp[req.userId];

    return res.json({ success: true, message: 'email changed' });
  } catch (e) {
    res.status(500).json({ message: 'server error final change' });
  }
};
