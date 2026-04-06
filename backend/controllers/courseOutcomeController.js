const CourseOutcome = require('../models/CourseOutcome');
const Subject = require('../models/Subject');
const Mapping = require('../models/Mapping');
const { applyOwnerScope, claimOwnership } = require('../utils/ownership');

const getCourseOutcomes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    const outcomes = await CourseOutcome.find(applyOwnerScope(filter, req.user._id))
      .populate({ path: 'subject', select: 'name code', populate: { path: 'course', select: 'name code' } })
      .sort({ code: 1 });

    res.json(outcomes);
  } catch (error) {
    next(error);
  }
};

const createCourseOutcome = async (req, res, next) => {
  try {
    const { subject, code, description, targetPercentage = 50, totalStudents = 0, studentsAchievedTarget = 0 } = req.body;
    if (!subject || !code || !description) {
      return res.status(400).json({ message: 'subject, code and description are required' });
    }

    const targetNum = Number(targetPercentage);
    if (Number.isNaN(targetNum) || targetNum < 1 || targetNum > 100) {
      return res.status(400).json({ message: 'targetPercentage must be between 1 and 100' });
    }

    const totalStudentsNum = Number(totalStudents);
    const studentsAchievedTargetNum = Number(studentsAchievedTarget);
    if (Number.isNaN(totalStudentsNum) || totalStudentsNum < 0) {
      return res.status(400).json({ message: 'totalStudents must be a non-negative number' });
    }
    if (Number.isNaN(studentsAchievedTargetNum) || studentsAchievedTargetNum < 0) {
      return res.status(400).json({ message: 'studentsAchievedTarget must be a non-negative number' });
    }
    if (studentsAchievedTargetNum > totalStudentsNum) {
      return res.status(400).json({ message: 'studentsAchievedTarget cannot exceed totalStudents' });
    }

    const subjectExists = await Subject.findOne(applyOwnerScope({ _id: subject }, req.user._id));
    if (!subjectExists) return res.status(404).json({ message: 'Subject not found' });

    const outcome = await CourseOutcome.create({
      owner: req.user._id,
      subject,
      code,
      description,
      targetPercentage: targetNum,
      totalStudents: totalStudentsNum,
      studentsAchievedTarget: studentsAchievedTargetNum
    });
    res.status(201).json(outcome);
  } catch (error) {
    next(error);
  }
};

const updateCourseOutcome = async (req, res, next) => {
  try {
    const outcome = await CourseOutcome.findOne(applyOwnerScope({ _id: req.params.id }, req.user._id));
    if (!outcome) return res.status(404).json({ message: 'Course outcome not found' });
    claimOwnership(outcome, req.user._id);

    const { subject, code, description, targetPercentage, totalStudents, studentsAchievedTarget } = req.body;
    if (subject) {
      const subjectExists = await Subject.findOne(applyOwnerScope({ _id: subject }, req.user._id));
      if (!subjectExists) return res.status(404).json({ message: 'Subject not found' });
      outcome.subject = subject;
    }

    outcome.code = code ?? outcome.code;
    outcome.description = description ?? outcome.description;
    if (targetPercentage !== undefined) {
      const targetNum = Number(targetPercentage);
      if (Number.isNaN(targetNum) || targetNum < 1 || targetNum > 100) {
        return res.status(400).json({ message: 'targetPercentage must be between 1 and 100' });
      }
      outcome.targetPercentage = targetNum;
    }
    if (totalStudents !== undefined) {
      const totalStudentsNum = Number(totalStudents);
      if (Number.isNaN(totalStudentsNum) || totalStudentsNum < 0) {
        return res.status(400).json({ message: 'totalStudents must be a non-negative number' });
      }
      outcome.totalStudents = totalStudentsNum;
    }
    if (studentsAchievedTarget !== undefined) {
      const studentsAchievedTargetNum = Number(studentsAchievedTarget);
      if (Number.isNaN(studentsAchievedTargetNum) || studentsAchievedTargetNum < 0) {
        return res.status(400).json({ message: 'studentsAchievedTarget must be a non-negative number' });
      }
      outcome.studentsAchievedTarget = studentsAchievedTargetNum;
    }
    if (outcome.studentsAchievedTarget > outcome.totalStudents) {
      return res.status(400).json({ message: 'studentsAchievedTarget cannot exceed totalStudents' });
    }

    const updated = await outcome.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteCourseOutcome = async (req, res, next) => {
  try {
    const outcome = await CourseOutcome.findOne(applyOwnerScope({ _id: req.params.id }, req.user._id));
    if (!outcome) return res.status(404).json({ message: 'Course outcome not found' });

    await Mapping.deleteMany(applyOwnerScope({ courseOutcome: outcome._id }, req.user._id));
    await CourseOutcome.deleteOne({ _id: outcome._id });

    res.json({ message: 'Course outcome and related mappings deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourseOutcomes, createCourseOutcome, updateCourseOutcome, deleteCourseOutcome };
