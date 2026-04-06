const getAttainmentPercentage = (totalStudents, studentsAchievedTarget) => {
  const total = Number(totalStudents) || 0;
  const achieved = Number(studentsAchievedTarget) || 0;
  if (total <= 0) return 0;
  return Number(((achieved / total) * 100).toFixed(2));
};

const getContributionLevelFromPercentage = (percentage) => {
  if (percentage >= 70) return 3;
  if (percentage >= 50) return 2;
  return 1;
};

module.exports = { getAttainmentPercentage, getContributionLevelFromPercentage };
