import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: false, default: '' },
    title: { type: String, required: false, default: '' }, // Changed from roleTitle to title
    startYear: { type: String, required: false, default: '' },
    endYear: { type: String, default: '' },
    present: { type: Boolean, default: false }, // Changed from isCurrent to present
    type: { type: String, default: '' }, // Changed from workType to type
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false, unique: false, default: '' },
    country: { type: String, default: '' },
    countryCode: { type: String, default: '+91' },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['client', 'freelancer'],
      required: true,
    },

    // Saved for both roles when provided; for clients we only persist skills (as per earlier choice)
    skills: [String],
    about: String,
    resumePath: String,
    isVerified: { type: Boolean, default: false },

    // Client-specific fields
    companyName: { type: String, default: '' },
    industry: { type: String, default: '' },

    // Freelancer-specific fields
    hourlyRate: { type: Number, default: 0 },

    // --- email-change workflow ---
    emailChange: {
      newEmail: { type: String, default: null },
      otpHash: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },

    // NEW: multiple experiences (freelancer step 4)
    experiences: { type: [experienceSchema], default: [] },
  },
  { timestamps: true },
);

// ✅ Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
