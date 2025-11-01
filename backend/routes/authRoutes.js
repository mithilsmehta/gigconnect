import express from "express";
import multer from "multer";
import path from "path";
import {
  register,
  login,
  me,
  uploadResumeOnly,
  googleLogin,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  sendEmailOtp,
  verifyEmailOtp,
} from "../controllers/authController.js";
import User from "../models/User.js";

const router = express.Router();

// ✅ Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Standard Routes
router.post("/send-otp", sendEmailOtp);
router.post("/verify-otp", verifyEmailOtp);
router.post("/register", upload.single("resume"), register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/upload-resume", upload.single("resume"), uploadResumeOnly);

// ✅ GOOGLE LOGIN
router.post("/google-login", googleLogin);

// ✅ UPDATE ROLE (for new Google users)
router.patch("/update-role", requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["client", "freelancer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: "Role updated successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update Role Error:", err.message);
    res.status(500).json({ success: false, message: "Server error updating role" });
  }
});

export default router;