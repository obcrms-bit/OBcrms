const DEFAULT_MAX_GAP = 5;
const DEFAULT_ALLOWED_BACKLOGS = 0;

// Helper to pick the strongest language score available
const getBestLanguageScore = (tests = []) => {
  const priorities = [
    { type: 'IELTS', key: 'overallScore' },
    { type: 'PTE', key: 'overallScore' },
    { type: 'TOEFL', key: 'overallScore' },
    { type: 'Duolingo', key: 'overallScore' },
  ];

  for (const pref of priorities) {
    const found = tests.find((t) => t.testType === pref.type);
    if (found) return { type: pref.type, score: found[pref.key] };
  }
  return null;
};

// Compute match score + tags + explanation for a single course
const calculateMatchScore = (course, academic, tests = [], career) => {
  let score = 100;
  const explanation = [];

  // --- Eligibility: academic ---
  if (academic && course.eligibilityRules) {
    const { minimumGPA = 0, minimumPercentage = 0, maximumGapYears = DEFAULT_MAX_GAP, allowedBacklogs = DEFAULT_ALLOWED_BACKLOGS } =
      course.eligibilityRules;

    if (minimumPercentage && academic.academicScore < minimumPercentage) {
      score -= 25;
      explanation.push(`Academic score ${academic.academicScore} < minimum ${minimumPercentage}.`);
    } else if (minimumGPA && academic.academicScore < minimumGPA) {
      score -= 20;
      explanation.push(`GPA ${academic.academicScore} < minimum ${minimumGPA}.`);
    } else {
      explanation.push('Meets academic threshold.');
    }

    if (academic.studyGap > maximumGapYears) {
      score -= 15;
      explanation.push(`Study gap ${academic.studyGap}y exceeds allowed ${maximumGapYears}y.`);
    }

    if (academic.backlogCount > allowedBacklogs) {
      score -= 10;
      explanation.push(`Backlogs ${academic.backlogCount} > allowed ${allowedBacklogs}.`);
    }
  } else {
    score -= 10;
    explanation.push('Academic profile incomplete.');
  }

  // --- Eligibility: language ---
  if (course.languageRequirements) {
    const {
      minimumIelts = 0,
      minimumPte = 0,
      minimumToefl = 0,
      minimumDuolingo = 0,
    } = course.languageRequirements;
    const best = getBestLanguageScore(tests);

    if (!best) {
      score -= 15;
      explanation.push('No language test found.');
    } else {
      const reqMap = {
        IELTS: minimumIelts,
        PTE: minimumPte,
        TOEFL: minimumToefl,
        Duolingo: minimumDuolingo,
      };
      const needed = reqMap[best.type] || 0;
      if (needed && best.score < needed) {
        score -= 20;
        explanation.push(`${best.type} ${best.score} < required ${needed}.`);
      } else {
        explanation.push(`Language OK via ${best.type} ${best.score}.`);
      }
    }
  }

  // --- Career alignment ---
  if (career) {
    if (career.preferredCountries?.length && !career.preferredCountries.includes(course.country)) {
      score -= 10;
      explanation.push(`Country ${course.country} not in preferred list.`);
    } else {
      explanation.push('Country matches preference.');
    }

    if (career.desiredLevel && career.desiredLevel !== course.level) {
      score -= 8;
      explanation.push(`Level ${course.level} differs from desired ${career.desiredLevel}.`);
    }

    if (career.targetPrograms?.length && !career.targetPrograms.includes(course.field)) {
      score -= 6;
      explanation.push(`Field ${course.field} not in target programs.`);
    }

    // Budget sensitivity (very light heuristic)
    if (career.budgetRange && course.tuition) {
      const numeric = Number(String(career.budgetRange).replace(/[^0-9]/g, '')) || 0;
      if (numeric && course.tuition > numeric) {
        score -= 8;
        explanation.push(`Tuition ${course.tuition} above stated budget ${career.budgetRange}.`);
      }
    }
  }

  // Clamp and categorize
  score = Math.max(0, Math.min(100, score));

  let recommendationType = 'Best Match';
  let eligibilityStatus = 'Eligible';

  if (score >= 85) {
    recommendationType = 'Best Match';
  } else if (score >= 70) {
    recommendationType = 'Safe Match';
  } else if (score >= 55) {
    recommendationType = 'Moderate Match';
    eligibilityStatus = 'Conditionally Eligible';
  } else if (score >= 35) {
    recommendationType = 'Aspirational Match';
    eligibilityStatus = 'Conditionally Eligible';
  } else if (score >= 20) {
    recommendationType = 'Alternative Pathway';
    eligibilityStatus = 'Conditionally Eligible';
    explanation.push('Suggest pathway/bridging or language prep to qualify.');
  } else {
    recommendationType = 'Not Eligible';
    eligibilityStatus = 'Not Eligible';
  }

  return {
    score,
    recommendationType,
    eligibilityStatus,
    explanation: explanation.join(' '),
  };
};

module.exports = {
  calculateMatchScore,
  getBestLanguageScore,
};
