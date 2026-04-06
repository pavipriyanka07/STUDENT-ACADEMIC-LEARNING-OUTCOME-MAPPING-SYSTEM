const mongoose = require('mongoose');

const markSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    courseOutcome: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOutcome', required: true },
    marks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

markSchema.index({ studentId: 1, subject: 1, courseOutcome: 1, createdAt: -1 });

module.exports = mongoose.model('Mark', markSchema);
