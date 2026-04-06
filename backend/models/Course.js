const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1, max: 10 },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

courseSchema.index({ owner: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Course', courseSchema);
