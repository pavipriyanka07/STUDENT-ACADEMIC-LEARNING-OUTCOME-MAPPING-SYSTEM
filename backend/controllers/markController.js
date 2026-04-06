const Mark = require('../models/Mark');
const Subject = require('../models/Subject');
const CourseOutcome = require('../models/CourseOutcome');

const recalculateCoAttainment = async (coId) => {
  const co = await CourseOutcome.findById(coId);
  if (!co) return null;

  const marks = await Mark.find({ courseOutcome: coId }).lean();
  const totalsByStudent = new Map();

  marks.forEach((m) => {
    const key = m.studentId;
    const entry = totalsByStudent.get(key) || { marks: 0, maxMarks: 0 };
    entry.marks += Number(m.marks) || 0;
    entry.maxMarks += Number(m.maxMarks) || 0;
    totalsByStudent.set(key, entry);
  });

  const targetPct = Number(co.targetPercentage) || 50;
  let achieved = 0;
  totalsByStudent.forEach((entry) => {
    const pct = entry.maxMarks > 0 ? (entry.marks / entry.maxMarks) * 100 : 0;
    if (pct >= targetPct) achieved += 1;
  });

  co.totalStudents = totalsByStudent.size;
  co.studentsAchievedTarget = achieved;
  await co.save();
  return co;
};

const getMarks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subjectId) filter.subject = req.query.subjectId;
    if (req.query.coId) filter.courseOutcome = req.query.coId;

    const marks = await Mark.find(filter)
      .populate('subject', 'name code semester')
      .populate('courseOutcome', 'code description targetPercentage')
      .sort({ createdAt: -1 });

    res.json(marks);
  } catch (error) {
    next(error);
  }
};

const createMark = async (req, res, next) => {
  try {
    const { studentId, subject, courseOutcome, marks, maxMarks } = req.body;
    if (!studentId || !subject || !courseOutcome || marks === undefined || maxMarks === undefined) {
      return res.status(400).json({ message: 'studentId, subject, courseOutcome, marks, maxMarks are required' });
    }

    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) return res.status(404).json({ message: 'Subject not found' });

    const coExists = await CourseOutcome.findById(courseOutcome);
    if (!coExists) return res.status(404).json({ message: 'Course outcome not found' });
    if (coExists.subject.toString() !== subject.toString()) {
      return res.status(400).json({ message: 'Course outcome does not belong to the subject' });
    }

    const marksNum = Number(marks);
    const maxMarksNum = Number(maxMarks);
    if (Number.isNaN(marksNum) || Number.isNaN(maxMarksNum) || marksNum < 0 || maxMarksNum <= 0) {
      return res.status(400).json({ message: 'marks and maxMarks must be valid positive numbers' });
    }
    if (marksNum > maxMarksNum) {
      return res.status(400).json({ message: 'marks cannot exceed maxMarks' });
    }

    const entry = await Mark.create({
      studentId: studentId.trim(),
      subject,
      courseOutcome,
      marks: marksNum,
      maxMarks: maxMarksNum
    });

    await recalculateCoAttainment(courseOutcome);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

const updateMark = async (req, res, next) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'Mark entry not found' });

    const previousCoId = mark.courseOutcome.toString();

    const { studentId, subject, courseOutcome, marks, maxMarks } = req.body;
    if (studentId !== undefined) mark.studentId = studentId.trim();

    if (subject) {
      const subjectExists = await Subject.findById(subject);
      if (!subjectExists) return res.status(404).json({ message: 'Subject not found' });
      mark.subject = subject;
    }

    if (courseOutcome) {
      const coExists = await CourseOutcome.findById(courseOutcome);
      if (!coExists) return res.status(404).json({ message: 'Course outcome not found' });
      const subjectToCheck = subject || mark.subject;
      if (subjectToCheck && coExists.subject.toString() !== subjectToCheck.toString()) {
        return res.status(400).json({ message: 'Course outcome does not belong to the subject' });
      }
      mark.courseOutcome = courseOutcome;
    }

    if (marks !== undefined) {
      const marksNum = Number(marks);
      if (Number.isNaN(marksNum) || marksNum < 0) {
        return res.status(400).json({ message: 'marks must be a positive number' });
      }
      mark.marks = marksNum;
    }

    if (maxMarks !== undefined) {
      const maxMarksNum = Number(maxMarks);
      if (Number.isNaN(maxMarksNum) || maxMarksNum <= 0) {
        return res.status(400).json({ message: 'maxMarks must be a positive number' });
      }
      mark.maxMarks = maxMarksNum;
    }

    if (mark.marks > mark.maxMarks) {
      return res.status(400).json({ message: 'marks cannot exceed maxMarks' });
    }

    const updated = await mark.save();
    await recalculateCoAttainment(updated.courseOutcome);
    if (previousCoId !== updated.courseOutcome.toString()) {
      await recalculateCoAttainment(previousCoId);
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteMark = async (req, res, next) => {
  try {
    const mark = await Mark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'Mark entry not found' });

    await Mark.deleteOne({ _id: mark._id });
    await recalculateCoAttainment(mark.courseOutcome);
    res.json({ message: 'Mark deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMarks, createMark, updateMark, deleteMark };
