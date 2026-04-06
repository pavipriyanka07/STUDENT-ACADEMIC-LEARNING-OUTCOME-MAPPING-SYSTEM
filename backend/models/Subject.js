const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    credits: { type: Number, required: true, min: 1, max: 10 }
  },
  { timestamps: true }
);

subjectSchema.index({ course: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
