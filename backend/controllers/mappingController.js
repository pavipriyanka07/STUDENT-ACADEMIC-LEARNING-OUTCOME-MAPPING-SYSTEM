const Mapping = require('../models/Mapping');
const CourseOutcome = require('../models/CourseOutcome');
const ProgramOutcome = require('../models/ProgramOutcome');
const Subject = require('../models/Subject');
const { applyOwnerScope, claimOwnership } = require('../utils/ownership');

const getMappings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subjectId) {
      const cos = await CourseOutcome.find(applyOwnerScope({ subject: req.query.subjectId }, req.user._id)).select('_id');
      filter.$or = [
        { subject: req.query.subjectId },
        { courseOutcome: { $in: cos.map((co) => co._id) } }
      ];
    }

    const mappings = await Mapping.find(applyOwnerScope(filter, req.user._id))
      .populate({
        path: 'courseOutcome',
        select: 'code description subject',
        populate: { path: 'subject', select: 'name code course', populate: { path: 'course', select: 'name code' } }
      })
      .populate('programOutcome', 'code description')
      .sort({ createdAt: -1 });

    res.json(mappings);
  } catch (error) {
    next(error);
  }
};

const upsertMapping = async (req, res, next) => {
  try {
    const { courseOutcome, programOutcome, level, mappingLevel } = req.body;

    if (!courseOutcome || !programOutcome) {
      return res.status(400).json({ message: 'courseOutcome and programOutcome are required' });
    }
    const coExists = await CourseOutcome.findOne(applyOwnerScope({ _id: courseOutcome }, req.user._id));
    const poExists = await ProgramOutcome.findOne(applyOwnerScope({ _id: programOutcome }, req.user._id));
    if (!coExists || !poExists) {
      return res.status(404).json({ message: 'Course outcome or program outcome not found' });
    }
    const subject = await Subject.findOne(applyOwnerScope({ _id: coExists.subject }, req.user._id)).select('course');
    if (subject && poExists.course.toString() !== subject.course.toString()) {
      return res.status(400).json({ message: 'Program outcome does not belong to the subject course' });
    }

    const finalLevel = Number(level ?? mappingLevel);
    if (Number.isNaN(finalLevel) || ![0, 1, 2, 3].includes(finalLevel)) {
      return res.status(400).json({ message: 'level must be 0, 1, 2, or 3' });
    }

    let mapping = await Mapping.findOne(applyOwnerScope({ courseOutcome, programOutcome }, req.user._id));
    if (mapping) {
      claimOwnership(mapping, req.user._id);
      mapping.level = finalLevel;
      mapping.subject = coExists.subject;
      await mapping.save();
    } else {
      mapping = await Mapping.create({
        owner: req.user._id,
        courseOutcome,
        programOutcome,
        subject: coExists.subject,
        level: finalLevel
      });
    }

    res.status(201).json(mapping);
  } catch (error) {
    next(error);
  }
};

const deleteMapping = async (req, res, next) => {
  try {
    const mapping = await Mapping.findOne(applyOwnerScope({ _id: req.params.id }, req.user._id));
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });

    await Mapping.deleteOne({ _id: mapping._id });
    res.json({ message: 'Mapping deleted' });
  } catch (error) {
    next(error);
  }
};

const getMatrix = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ message: 'subjectId query parameter is required' });

    const subject = await Subject.findOne(applyOwnerScope({ _id: subjectId }, req.user._id)).populate('course', 'name code');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const courseOutcomes = await CourseOutcome.find(applyOwnerScope({ subject: subjectId }, req.user._id)).sort({ code: 1 });
    const programOutcomes = await ProgramOutcome.find(applyOwnerScope({ course: subject.course._id }, req.user._id)).sort({ code: 1 });

    let mappings = await Mapping.find(applyOwnerScope({
      courseOutcome: { $in: courseOutcomes.map((co) => co._id) }
    }, req.user._id));
    if (mappings.length === 0 && courseOutcomes.length && programOutcomes.length) {
      const coIds = courseOutcomes.map((co) => co._id);
      const poIds = programOutcomes.map((po) => po._id);
      const rawMappings = await Mapping.collection.find({
        coId: { $in: coIds },
        poId: { $in: poIds },
        $or: [{ owner: req.user._id }, { owner: { $exists: false } }]
      }).toArray();
      mappings = rawMappings.map((m) => ({
        _id: m._id,
        courseOutcome: m.coId,
        programOutcome: m.poId,
        level: m.level ?? m.mappingLevel
      }));
      if (rawMappings.length) {
        console.warn('[matrix] using legacy mapping fields coId/poId');
      }
    }

    const lookup = {};
    mappings.forEach((m) => {
      const rawLevel = m.level ?? (typeof m.get === 'function' ? m.get('mappingLevel') : m.mappingLevel);
      const levelNum = Number(rawLevel);
      if (Number.isNaN(levelNum)) {
        console.warn('[matrix] mapping missing level', {
          mappingId: m._id?.toString?.(),
          courseOutcome: m.courseOutcome?.toString?.(),
          programOutcome: m.programOutcome?.toString?.(),
          rawLevel
        });
        return;
      }
      lookup[`${m.courseOutcome.toString()}_${m.programOutcome.toString()}`] = levelNum;
    });

    console.log('[matrix] summary', {
      subjectId,
      courseOutcomes: courseOutcomes.length,
      programOutcomes: programOutcomes.length,
      mappings: mappings.length
    });

    const rows = courseOutcomes.map((co) => {
      const row = { coId: co._id, coCode: co.code, coDescription: co.description, values: {} };
      programOutcomes.forEach((po) => {
        const key = `${co._id.toString()}_${po._id.toString()}`;
        row.values[po.code] = lookup[key] ?? 0;
      });
      return row;
    });

    res.json({ subject, programOutcomes, rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMappings, upsertMapping, deleteMapping, getMatrix };
