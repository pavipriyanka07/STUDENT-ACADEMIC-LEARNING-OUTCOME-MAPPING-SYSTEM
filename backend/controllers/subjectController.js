const Subject = require('../models/Subject');
const Course = require('../models/Course');
const CourseOutcome = require('../models/CourseOutcome');
const Mapping = require('../models/Mapping');
const { applyOwnerScope, claimOwnership } = require('../utils/ownership');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSubjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    const subjects = await Subject.find(applyOwnerScope(filter, req.user._id))
      .populate('course', 'name code')
      .sort({ semester: 1, code: 1 });
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { course, name, code, semester, credits } = req.body;
    if (!course || !name || !code || !semester || credits === undefined) {
      return res.status(400).json({ message: 'course, name, code, semester and credits are required' });
    }

    const courseExists = await Course.findOne(applyOwnerScope({ _id: course }, req.user._id));
    if (!courseExists) return res.status(404).json({ message: 'Parent course not found' });

    const existsByCode = await Subject.findOne(applyOwnerScope({ course, code: code.toUpperCase() }, req.user._id));
    if (existsByCode) return res.status(400).json({ message: 'Subject code already exists in this course' });

    const existsByName = await Subject.findOne(applyOwnerScope({
      course,
      name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i')
    }, req.user._id));
    if (existsByName) return res.status(400).json({ message: 'Subject name already exists in this course' });

    const creditsNum = Number(credits);
    if (Number.isNaN(creditsNum) || creditsNum < 1) {
      return res.status(400).json({ message: 'credits must be a positive number' });
    }

    const subject = await Subject.create({
      owner: req.user._id,
      course,
      name,
      code,
      semester,
      credits: creditsNum
    });
    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne(applyOwnerScope({ _id: req.params.id }, req.user._id));
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    claimOwnership(subject, req.user._id);

    const { course, name, code, semester, credits } = req.body;
    const targetCourseId = course || subject.course;
    if (course) {
      const courseExists = await Course.findOne(applyOwnerScope({ _id: course }, req.user._id));
      if (!courseExists) return res.status(404).json({ message: 'Parent course not found' });
      subject.course = course;
    }

    if (code) {
      const existsByCode = await Subject.findOne(applyOwnerScope({
        course: targetCourseId,
        code: code.toUpperCase(),
        _id: { $ne: subject._id }
      }, req.user._id));
      if (existsByCode) return res.status(400).json({ message: 'Subject code already exists in this course' });
    }

    if (name) {
      const existsByName = await Subject.findOne(applyOwnerScope({
        course: targetCourseId,
        name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
        _id: { $ne: subject._id }
      }, req.user._id));
      if (existsByName) return res.status(400).json({ message: 'Subject name already exists in this course' });
    }

    subject.name = name ?? subject.name;
    subject.code = code ?? subject.code;
    subject.semester = semester ?? subject.semester;
    if (credits !== undefined) {
      const creditsNum = Number(credits);
      if (Number.isNaN(creditsNum) || creditsNum < 1) {
        return res.status(400).json({ message: 'credits must be a positive number' });
      }
      subject.credits = creditsNum;
    }

    const updated = await subject.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOne(applyOwnerScope({ _id: req.params.id }, req.user._id));
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const cos = await CourseOutcome.find(applyOwnerScope({ subject: subject._id }, req.user._id));
    const coIds = cos.map((co) => co._id);

    await Mapping.deleteMany(applyOwnerScope({ courseOutcome: { $in: coIds } }, req.user._id));
    await CourseOutcome.deleteMany(applyOwnerScope({ subject: subject._id }, req.user._id));
    await Subject.deleteOne({ _id: subject._id });

    res.json({ message: 'Subject and related outcomes/mappings deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
