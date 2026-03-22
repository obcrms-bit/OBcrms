/* Lightweight sanity check for Course AI scoring.
   Run with: node scripts/courseAi.test.js
*/
const assert = require('assert');
const { calculateMatchScore } = require('../utils/courseAi.util');

const sampleCourse = {
  country: 'Canada',
  level: 'Postgraduate',
  field: 'Computer Science',
  tuition: 25000,
  eligibilityRules: {
    minimumPercentage: 65,
    maximumGapYears: 5,
    allowedBacklogs: 2,
  },
  languageRequirements: {
    minimumIelts: 6.5,
    minimumPte: 58,
  },
};

const academic = {
  academicScore: 72,
  studyGap: 1,
  backlogCount: 1,
};

const tests = [{ testType: 'IELTS', overallScore: 7 }];
const career = {
  preferredCountries: ['Canada', 'UK'],
  desiredLevel: 'Postgraduate',
  targetPrograms: ['Computer Science'],
  budgetRange: '$30000',
};

const result = calculateMatchScore(sampleCourse, academic, tests, career);

assert(result.score <= 100 && result.score >= 0, 'Score should be within 0..100');
assert(result.recommendationType, 'Recommendation type should be present');
assert(result.eligibilityStatus, 'Eligibility status should be present');

console.log('Course AI test passed:', result);
