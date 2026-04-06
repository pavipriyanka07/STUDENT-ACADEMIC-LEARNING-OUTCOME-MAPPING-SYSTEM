const Course = require('../models/Course');
const Subject = require('../models/Subject');
const CourseOutcome = require('../models/CourseOutcome');
const ProgramOutcome = require('../models/ProgramOutcome');
const Mapping = require('../models/Mapping');
const { getAttainmentPercentage, getContributionLevelFromPercentage } = require('../utils/attainment');

const getLevelLabel = (level) => {
  if (level === 3) return 'High';
  if (level === 2) return 'Medium';
  return 'Low';
};

const getReports = async (req, res, next) => {
  try {
    const [courses, subjects, courseOutcomes, programOutcomes, mappings] = await Promise.all([
      Course.find().select('_id name code department duration').lean(),
      Subject.find().select('_id name code semester credits course').lean(),
      CourseOutcome.find().select('_id code description subject totalStudents studentsAchievedTarget').lean(),
      ProgramOutcome.find().select('_id code description course').lean(),
      Mapping.find().select('_id courseOutcome programOutcome level').lean()
    ]);

    const subjectById = {};
    subjects.forEach((s) => { subjectById[s._id.toString()] = s; });

    const courseById = {};
    courses.forEach((c) => { courseById[c._id.toString()] = c; });

    const coById = {};
    const coReport = courseOutcomes.map((co) => {
      const percentage = getAttainmentPercentage(co.totalStudents, co.studentsAchievedTarget);
      const level = getContributionLevelFromPercentage(percentage);
      const subject = subjectById[co.subject.toString()];
      const course = subject ? courseById[subject.course.toString()] : null;
      const row = {
        coId: co._id,
        coCode: co.code,
        coDescription: co.description,
        subjectCode: subject?.code || '',
        subjectName: subject?.name || '',
        courseCode: course?.code || '',
        courseName: course?.name || '',
        totalStudents: Number(co.totalStudents) || 0,
        studentsAchievedTarget: Number(co.studentsAchievedTarget) || 0,
        attainmentPercentage: percentage,
        level,
        levelLabel: getLevelLabel(level)
      };
      coById[co._id.toString()] = row;
      return row;
    });

    const poContribution = {};
    programOutcomes.forEach((po) => {
      poContribution[po._id.toString()] = { sumWeighted: 0, sumLevel: 0, count: 0 };
    });

    mappings.forEach((mapping) => {
      const co = coById[mapping.courseOutcome.toString()];
      if (!co) return;
      if (Number(mapping.level) <= 0) return;
      const entry = poContribution[mapping.programOutcome.toString()];
      if (!entry) return;
      const levelNum = Number(mapping.level);
      entry.sumWeighted += co.attainmentPercentage * levelNum;
      entry.sumLevel += levelNum;
      entry.count += 1;
    });

    const poReport = programOutcomes.map((po) => {
      const entry = poContribution[po._id.toString()] || { sumWeighted: 0, sumLevel: 0, count: 0 };
      const percentage = entry.sumLevel
        ? Number((entry.sumWeighted / entry.sumLevel).toFixed(2))
        : 0;
      const level = getContributionLevelFromPercentage(percentage);
      const course = courseById[po.course.toString()];
      return {
        poId: po._id,
        poCode: po.code,
        poDescription: po.description,
        courseCode: course?.code || '',
        courseName: course?.name || '',
        attainmentPercentage: percentage,
        level,
        levelLabel: getLevelLabel(level),
        mappedCount: entry.count
      };
    });

    const subjectReport = subjects.map((subject) => {
      const subjectCos = courseOutcomes.filter((co) => co.subject.toString() === subject._id.toString());
      const avg = subjectCos.length
        ? Number((subjectCos.reduce((sum, co) => sum + getAttainmentPercentage(co.totalStudents, co.studentsAchievedTarget), 0) / subjectCos.length).toFixed(2))
        : 0;
      const course = courseById[subject.course.toString()];
      return {
        subjectId: subject._id,
        subjectCode: subject.code,
        subjectName: subject.name,
        semester: subject.semester,
        credits: subject.credits,
        courseCode: course?.code || '',
        courseName: course?.name || '',
        averageCoAttainment: avg,
        level: getContributionLevelFromPercentage(avg),
        levelLabel: getLevelLabel(getContributionLevelFromPercentage(avg))
      };
    });

    res.json({
      generatedAt: new Date().toISOString(),
      coReport,
      poReport,
      subjectReport
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReports };
