import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// temporary email → otp store
let otpStore = {}; 

// ✅ Country-specific phone limits
const PHONE_LIMITS = {
  India: 10,
  "United States": 10,
  Canada: 10,
  "United Kingdom": 10,
  Australia: 9,
  Germany: 11,
  France: 9,
  Japan: 10,
  Brazil: 11,
  "United Arab Emirates": 9,
  Other: 8,
};

// ✅ JWT generator
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "supersecret", { expiresIn: "1d" });

// ✅ reCAPTCHA validation
export const verifyRecaptcha = async (token) => {
  try {
    const secret = process.env.RECAPTCHA_SECRET;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    return data.success && (data.score || 0) > 0.3;
  } catch (err) {
    console.error("reCAPTCHA Error:", err);
    return false;
  }
};

// ✅ Send OTP via Email (with existing user check + resend support)
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    // 🛑 Check if account already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Account already exists. Please login instead.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // store OTP and expiry for new registration only
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"GigConnect Verification" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2 style="color:#16a34a">Email Verification</h2>
          <p>Use this 6-digit code to verify your email:</p>
          <h1 style="letter-spacing:6px">${otp}</h1>
          <p>This code will expire in <b>5 minutes</b>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Send OTP Error:", err.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ✅ Verify OTP
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Missing email or OTP" });

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: "OTP not found or expired" });
    if (Date.now() > record.expiresAt)
      return res.status(400).json({ message: "OTP expired" });

    if (parseInt(otp) !== record.otp)
      return res.status(400).json({ message: "Invalid OTP" });

    delete otpStore[email];
    res.json({ success: true, message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verify OTP Error:", err.message);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

// ✅ REGISTER USER
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      phone,
      password,
      confirmPassword,
      role,
      skills,
      about,
      recaptchaToken,
      skipResume,
    } = req.body;

    // ✅ reCAPTCHA validation
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: "reCAPTCHA failed. Try again." });
    }

    // ✅ Basic field validation
    if (!skipResume) {
      if (
        !firstName ||
        !lastName ||
        !email ||
        !phone ||
        !password ||
        !confirmPassword ||
        !role
      ) {
        return res.status(400).json({ message: "Please fill all required fields." });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
      }
    }

    // ✅ Clean up phone digits properly
    let digits = "";
    if (phone) {
      digits = phone.replace(/\D/g, "");
      if (country && PHONE_LIMITS[country] && digits.length !== PHONE_LIMITS[country]) {
        return res.status(400).json({
          message: `Phone number must be ${PHONE_LIMITS[country]} digits for ${country}.`,
        });
      }
    }

    // ✅ Duplicate checks
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use." });
      }
    }

    if (digits) {
      const existingPhone = await User.findOne({ phone: digits });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone already in use." });
      }
    }

    // ✅ Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      country,
      phone: digits,
      password,
      role,
      skills: typeof skills === "string" ? skills.split(",").map((s) => s.trim()) : [],
      about,
      resumePath: req.file ? `/uploads/${req.file.filename}` : null,
      isVerified: true,
    });

    await user.save();
    res.status(201).json({ success: true, message: "User created successfully!" });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { emailOrPhone, password, recaptchaToken } = req.body;

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman)
      return res.status(400).json({ message: "reCAPTCHA failed. Try again." });

    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Please enter both fields." });

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    // ✅ Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const firebaseKey = process.env.FIREBASE_API_KEY;
      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            password,
            returnSecureToken: true,
          }),
        }
      );

      const firebaseData = await firebaseRes.json();

      if (firebaseData.error)
        return res.status(400).json({ message: "Invalid credentials." });

      // ✅ Firebase confirmed → update Mongo password hash
      const newHashed = await bcrypt.hash(password, 10);
      user.password = newHashed;
      await user.save();
    }

    if (!user.isVerified)
      return res.status(403).json({ message: "Email not verified yet." });

    const token = signToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ✅ RESET PASSWORD — Only new password works
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ message: "Email and new password required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: "Password reset successful!" });
  } catch (err) {
    console.error("Reset Password Error:", err.message);
    res.status(500).json({ message: "Failed to reset password." });
  }
};

// ✅ FETCH PROFILE
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Profile Error:", err.message);
    res.status(500).json({ message: "Server error fetching profile." });
  }
};

// ✅ UPLOAD RESUME ONLY
export const uploadResumeOnly = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });
    res.json({ success: true, path: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error("Resume Upload Error:", err.message);
    res.status(500).json({ message: "Failed to upload resume." });
  }
};

// ✅ GOOGLE LOGIN / REGISTER handler (updated)
export const googleLogin = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    let user = await User.findOne({ email });

    if (user) {
      // Existing account → just login
      const token = signToken(user._id);
      return res.status(200).json({
        success: true,
        message: "Welcome back!",
        token,
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        },
        isNew: !user.role, // if user exists but role is not set yet
      });
    }

    // 🆕 New Google user → create partial account (no phone or role yet)
    user = new User({
      firstName: firstName || "Google",
      lastName: lastName || "User",
      email,
      phone: null,
      country: "",
      password: await bcrypt.hash(Date.now().toString(), 10),
      role: null, // ⚠️ leave blank intentionally
      isVerified: true,
    });

    await user.save();

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: "New Google user created!",
      token,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
      isNew: true,
    });
  } catch (err) {
    console.error("Google Login Error:", err.message);
    res.status(500).json({ message: "Server error during Google login." });
  }
};