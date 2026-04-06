const mongoose = require('mongoose');

const programOutcomeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
  },
  { timestamps: true }
);

programOutcomeSchema.index({ owner: 1, course: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ProgramOutcome', programOutcomeSchema);
