const Course = require('../models/Course');
const Subject = require('../models/Subject');
const CourseOutcome = require('../models/CourseOutcome');
const Mapping = require('../models/Mapping');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { name, code, description, department, duration } = req.body;
    if (!name || !code || !department || duration === undefined) {
      return res.status(400).json({ message: 'name, code, department and duration are required' });
    }

    const existsByCode = await Course.findOne({ code: code.toUpperCase() });
    if (existsByCode) return res.status(400).json({ message: 'Course code already exists' });

    const existsByName = await Course.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') });
    if (existsByName) return res.status(400).json({ message: 'Course name already exists' });

    const durationNum = Number(duration);
    if (Number.isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({ message: 'duration must be a positive number' });
    }

    const course = await Course.create({ name, code, description, department, duration: durationNum });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { name, code, description, department, duration } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (code && code.toUpperCase() !== course.code) {
      const existsByCode = await Course.findOne({ code: code.toUpperCase(), _id: { $ne: course._id } });
      if (existsByCode) return res.status(400).json({ message: 'Course code already exists' });
    }

    if (name && name.trim().toLowerCase() !== course.name.trim().toLowerCase()) {
      const existsByName = await Course.findOne({
        name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i'),
        _id: { $ne: course._id }
      });
      if (existsByName) return res.status(400).json({ message: 'Course name already exists' });
    }

    course.name = name ?? course.name;
    course.code = code ?? course.code;
    course.description = description ?? course.description;
    course.department = department ?? course.department;
    if (duration !== undefined) {
      const durationNum = Number(duration);
      if (Number.isNaN(durationNum) || durationNum < 1) {
        return res.status(400).json({ message: 'duration must be a positive number' });
      }
      course.duration = durationNum;
    }

    const updated = await course.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const subjects = await Subject.find({ course: course._id });
    const subjectIds = subjects.map((s) => s._id);
    const cos = await CourseOutcome.find({ subject: { $in: subjectIds } });
    const coIds = cos.map((co) => co._id);

    await Mapping.deleteMany({ courseOutcome: { $in: coIds } });
    await CourseOutcome.deleteMany({ subject: { $in: subjectIds } });
    await Subject.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });

    res.json({ message: 'Course and related data deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCourses, createCourse, updateCourse, deleteCourse };
