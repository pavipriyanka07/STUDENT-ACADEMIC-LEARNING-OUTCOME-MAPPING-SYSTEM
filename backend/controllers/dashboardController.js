const Course = require('../models/Course');
const Subject = require('../models/Subject');
const CourseOutcome = require('../models/CourseOutcome');
const ProgramOutcome = require('../models/ProgramOutcome');
const Mapping = require('../models/Mapping');
const { getAttainmentPercentage, getContributionLevelFromPercentage } = require('../utils/attainment');
const { applyOwnerScope } = require('../utils/ownership');

const getLevelLabel = (level) => {
  if (level === 3) return 'High';
  if (level === 2) return 'Medium';
  return 'Low';
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const [courses, subjects, courseOutcomes, programOutcomes, mappings] = await Promise.all([
      Course.find(applyOwnerScope({}, req.user._id)).select('_id code name').lean(),
      Subject.find(applyOwnerScope({}, req.user._id)).select('_id course').lean(),
      CourseOutcome.find(applyOwnerScope({}, req.user._id)).select('_id code subject totalStudents studentsAchievedTarget').lean(),
      ProgramOutcome.find(applyOwnerScope({}, req.user._id)).select('_id code').lean(),
      Mapping.find(applyOwnerScope({}, req.user._id)).select('_id courseOutcome programOutcome level').lean()
    ]);

    const coById = {};
    const coStats = courseOutcomes.map((co) => {
      const percentage = getAttainmentPercentage(co.totalStudents, co.studentsAchievedTarget);
      const level = getContributionLevelFromPercentage(percentage);
      const row = {
        coId: co._id,
        code: co.code,
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
      const levelNum = Number(mapping.level);
      if (levelNum <= 0) return;
      const entry = poContribution[mapping.programOutcome.toString()];
      if (!entry) return;
      entry.sumWeighted += co.attainmentPercentage * levelNum;
      entry.sumLevel += levelNum;
      entry.count += 1;
    });

    const poStats = programOutcomes.map((po) => {
      const entry = poContribution[po._id.toString()] || { sumWeighted: 0, sumLevel: 0, count: 0 };
      const percentage = entry.sumLevel
        ? Number((entry.sumWeighted / entry.sumLevel).toFixed(2))
        : 0;
      const level = getContributionLevelFromPercentage(percentage);
      return {
        poId: po._id,
        code: po.code,
        attainmentPercentage: percentage,
        level,
        levelLabel: getLevelLabel(level),
        mappedCount: entry.count
      };
    });

    const totalCoPoPairs = courseOutcomes.length * programOutcomes.length;
    const mappedPairs = mappings.length;
    const mappingCoveragePercentage = totalCoPoPairs
      ? Number(((mappedPairs / totalCoPoPairs) * 100).toFixed(2))
      : 0;

    const coOverallPercentage = coStats.length
      ? Number((coStats.reduce((sum, item) => sum + item.attainmentPercentage, 0) / coStats.length).toFixed(2))
      : 0;
    const poOverallPercentage = poStats.length
      ? Number((poStats.reduce((sum, item) => sum + item.attainmentPercentage, 0) / poStats.length).toFixed(2))
      : 0;

    const subjectById = {};
    subjects.forEach((s) => { subjectById[s._id.toString()] = s; });

    const coursePerformanceMap = {};
    courseOutcomes.forEach((co) => {
      const subject = subjectById[co.subject?.toString()];
      if (!subject) return;
      const courseId = subject.course.toString();
      const percentage = getAttainmentPercentage(co.totalStudents, co.studentsAchievedTarget);
      const entry = coursePerformanceMap[courseId] || { total: 0, count: 0 };
      entry.total += percentage;
      entry.count += 1;
      coursePerformanceMap[courseId] = entry;
    });

    const coursePerformance = courses.map((course) => {
      const entry = coursePerformanceMap[course._id.toString()] || { total: 0, count: 0 };
      const avg = entry.count ? Number((entry.total / entry.count).toFixed(2)) : 0;
      return {
        courseId: course._id,
        courseCode: course.code,
        courseName: course.name,
        averageCoAttainment: avg,
        level: getContributionLevelFromPercentage(avg),
        levelLabel: getLevelLabel(getContributionLevelFromPercentage(avg))
      };
    });

    res.json({
      totals: {
        courses: courses.length,
        subjects: subjects.length,
        courseOutcomes: courseOutcomes.length,
        programOutcomes: programOutcomes.length,
        mappings: mappedPairs,
        totalCoPoPairs,
        mappingCoveragePercentage
      },
      overall: {
        coAttainmentPercentage: coOverallPercentage,
        poAttainmentPercentage: poOverallPercentage,
        coLevel: getLevelLabel(getContributionLevelFromPercentage(coOverallPercentage)),
        poLevel: getLevelLabel(getContributionLevelFromPercentage(poOverallPercentage))
      },
      coStats,
      poStats,
      coursePerformance
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary };
