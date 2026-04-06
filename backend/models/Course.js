const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1, max: 10 },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
