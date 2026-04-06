const mongoose = require('mongoose');

const mappingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    courseOutcome: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOutcome', required: true },
    programOutcome: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramOutcome', required: true },
    level: { type: Number, enum: [0, 1, 2, 3], required: true, default: 0 }
  },
  { timestamps: true }
);

mappingSchema.index({ owner: 1, courseOutcome: 1, programOutcome: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Mapping', mappingSchema);
