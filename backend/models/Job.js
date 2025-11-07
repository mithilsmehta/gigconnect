import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    skills: [String], // Array of required skills
    type: { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote' },
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    roles: [roleSchema],
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientName: { type: String, required: true },
    clientCompany: { type: String, default: '' },
    status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
    applications: [
      {
        freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now },
        proposal: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      },
    ],
  },
  { timestamps: true },
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
