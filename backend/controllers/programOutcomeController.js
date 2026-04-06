const ProgramOutcome = require('../models/ProgramOutcome');
const Mapping = require('../models/Mapping');
const Course = require('../models/Course');

const getProgramOutcomes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.courseId) filter.course = req.query.courseId;
    const outcomes = await ProgramOutcome.find(filter).populate('course', 'name code').sort({ code: 1 });
    res.json(outcomes);
  } catch (error) {
    next(error);
  }
};

const createProgramOutcome = async (req, res, next) => {
  try {
    const { code, description, course } = req.body;
    if (!code || !description || !course) {
      return res.status(400).json({ message: 'code, description and course are required' });
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) return res.status(404).json({ message: 'Parent course not found' });

    const po = await ProgramOutcome.create({ code, description, course });
    res.status(201).json(po);
  } catch (error) {
    next(error);
  }
};

const updateProgramOutcome = async (req, res, next) => {
  try {
    const po = await ProgramOutcome.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Program outcome not found' });

    const { code, description, course } = req.body;
    if (course) {
      const courseExists = await Course.findById(course);
      if (!courseExists) return res.status(404).json({ message: 'Parent course not found' });
      po.course = course;
    }
    po.code = code ?? po.code;
    po.description = description ?? po.description;

    const updated = await po.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteProgramOutcome = async (req, res, next) => {
  try {
    const po = await ProgramOutcome.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'Program outcome not found' });

    await Mapping.deleteMany({ programOutcome: po._id });
    await ProgramOutcome.deleteOne({ _id: po._id });

    res.json({ message: 'Program outcome and related mappings deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProgramOutcomes, createProgramOutcome, updateProgramOutcome, deleteProgramOutcome };
