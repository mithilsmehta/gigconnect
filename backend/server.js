// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
// import freelancerRoutes from "./routes/freelancerRoutes.js";

dotenv.config();
const app = express();

// Fix __dirname usage in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
// app.use("/api/freelancers", freelancerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log(`🚀 Server running on port ${process.env.PORT || 5000}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
