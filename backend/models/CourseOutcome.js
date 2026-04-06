const mongoose = require('mongoose');

const courseOutcomeSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    targetPercentage: { type: Number, default: 50, min: 1, max: 100 },
    totalStudents: { type: Number, default: 0, min: 0 },
    studentsAchievedTarget: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

courseOutcomeSchema.virtual('coAttainmentPercentage').get(function coAttainmentPercentageGetter() {
  if (!this.totalStudents) return 0;
  return Number(((this.studentsAchievedTarget / this.totalStudents) * 100).toFixed(2));
});

courseOutcomeSchema.set('toJSON', { virtuals: true });
courseOutcomeSchema.set('toObject', { virtuals: true });

courseOutcomeSchema.index({ subject: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('CourseOutcome', courseOutcomeSchema);
