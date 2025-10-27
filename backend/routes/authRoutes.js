import express from "express";
import multer from "multer";
import path from "path";
import { register, login, me, uploadResumeOnly, googleLogin} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { sendEmailOtp, verifyEmailOtp } from "../controllers/authController.js";

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

// ✅ Routes
router.post("/send-otp", sendEmailOtp);
router.post("/verify-otp", verifyEmailOtp);
router.post("/register", upload.single("resume"), register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/upload-resume", upload.single("resume"), uploadResumeOnly);
router.post("/google-login", googleLogin);


export default router;