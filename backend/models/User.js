import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    roleTitle: { type: String, required: true },
    startYear: { type: String, required: true },   // keep as string to allow YYYY or MM/YYYY if you decide later
    endYear: { type: String, default: "" },        // "Present" when isCurrent === true
    isCurrent: { type: Boolean, default: false },
    workType: {
      type: String,
      enum: ["Remote", "Onsite", "Hybrid"],
      default: "Remote",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    phone:     { type: String, required: false, unique: false, default: "" },
    country:   { type: String },
    password:  { type: String, required: true },

    role: {
      type: String,
      enum: ["client", "freelancer"],
      required: false,
      default: null,
    },

    // Saved for both roles when provided; for clients we only persist skills (as per earlier choice)
    skills: [String],
    about: String,
    resumePath: String,
    isVerified: { type: Boolean, default: false },

    // NEW: multiple experiences (freelancer step 4)
    experiences: { type: [experienceSchema], default: [] },
  },
  { timestamps: true }
);

// ✅ Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;