const mongoose = require('mongoose');

const programOutcomeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
  },
  { timestamps: true }
);

programOutcomeSchema.index({ course: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('ProgramOutcome', programOutcomeSchema);
