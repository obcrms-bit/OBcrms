/**
 * Visa Risk Assessment Service — deterministic, rule-based
 * Returns: { visaSuccessProbability, riskCategory, reasons, recommendations, factors }
 */

const FACTOR_WEIGHTS = {
  academic: 20,
  language: 20,
  financial: 25,
  documentation: 15,
  travelHistory: 10,
  interview: 5,
  other: 5,
};

/**
 * @param {Object} params
 * @param {number} params.academicGPA           - 0 to 4 scale
 * @param {string} params.englishTestType       - ielts|pte|toefl|duolingo|none
 * @param {number} params.englishScore          - raw score
 * @param {string} params.destinationCountry   - country code
 * @param {number} params.financialStrength     - 0 to 100 (derived from financial assessment)
 * @param {number} params.gapYears              - number of gap years
 * @param {number} params.refusalCount          - number of prior refusals
 * @param {boolean} params.hasVisaHistory       - has prior travel history
 * @param {number} params.docCompletionRate     - 0 to 100
 * @param {number} params.mockInterviewScore    - 0 to 10
 * @param {string} params.ruleSnapshot          - visa rule object (for country-specific flags)
 */
function assessVisaRisk(params) {
  const {
    academicGPA = 2.5,
    englishTestType = 'none',
    englishScore = 0,
    destinationCountry = '',
    financialStrength = 50,
    gapYears = 0,
    refusalCount = 0,
    hasVisaHistory = false,
    docCompletionRate = 50,
    mockInterviewScore = 5,
    ruleSnapshot = null,
  } = params;

  const reasons = [];
  const recommendations = [];
  const factors = {};

  // ── Academic factor ──────────────────────────────────────────────────────
  let academicScore = 0;
  if (academicGPA >= 3.5) academicScore = 100;
  else if (academicGPA >= 3.0) academicScore = 80;
  else if (academicGPA >= 2.5) academicScore = 60;
  else if (academicGPA >= 2.0) academicScore = 40;
  else {
    academicScore = 20;
    reasons.push('Low academic GPA may raise concerns for visa officer');
  }
  if (gapYears > 2) {
    academicScore -= gapYears * 5;
    reasons.push(`${gapYears} gap years detected — provide gap year explanation letter`);
    recommendations.push('Prepare a strong gap year statement of purpose');
  }
  factors.academicScore = Math.max(0, Math.min(100, academicScore));

  // ── Language factor ──────────────────────────────────────────────────────
  let languageScore = 0;
  const countryCode = destinationCountry.toUpperCase();
  const minIelts = { UK: 6.0, US: 6.0, CA: 6.0, AU: 6.0, DE: 6.0 }[countryCode] || 6.0;

  if (englishTestType === 'none') {
    languageScore = 30;
    reasons.push('No English test score on record');
    recommendations.push('Complete IELTS/PTE test before visa application');
  } else if (englishTestType === 'ielts') {
    if (englishScore >= 7.0) languageScore = 100;
    else if (englishScore >= 6.5) languageScore = 85;
    else if (englishScore >= minIelts) languageScore = 70;
    else {
      languageScore = 40;
      reasons.push(`IELTS ${englishScore} is below minimum ${minIelts} for ${destinationCountry}`);
    }
  } else if (englishTestType === 'pte') {
    if (englishScore >= 65) languageScore = 100;
    else if (englishScore >= 58) languageScore = 85;
    else if (englishScore >= 50) languageScore = 70;
    else {
      languageScore = 40;
      reasons.push(`PTE ${englishScore} may be insufficient`);
    }
  } else if (englishTestType === 'toefl') {
    if (englishScore >= 100) languageScore = 100;
    else if (englishScore >= 90) languageScore = 80;
    else languageScore = 55;
  } else {
    languageScore = 60;
  }
  factors.languageScore = Math.max(0, Math.min(100, languageScore));

  // ── Financial factor ──────────────────────────────────────────────────────
  let financialScore = financialStrength;
  if (financialStrength < 40) {
    reasons.push('Financial capacity appears insufficient for visa requirements');
    recommendations.push(
      'Strengthen financial evidence: additional bank statements or sponsor letter'
    );
  }
  if (ruleSnapshot?.financialRequirements?.blockedAccountRequired && !params.blockedAccountDone) {
    financialScore -= 15;
    reasons.push('Blocked account required but not confirmed for Germany');
    recommendations.push('Open blocked account (€11,904) before visa appointment');
  }
  factors.financialScore = Math.max(0, Math.min(100, financialScore));

  // ── Documentation factor ─────────────────────────────────────────────────
  factors.documentScore = docCompletionRate;
  if (docCompletionRate < 50) {
    reasons.push('Document checklist is less than 50% complete');
    recommendations.push('Complete all required documents before submission');
  } else if (docCompletionRate < 75) {
    recommendations.push('Review and finalise remaining documents promptly');
  }

  // ── Travel history factor ────────────────────────────────────────────────
  const travelScore = hasVisaHistory ? 80 : 50;
  if (hasVisaHistory) recommendations.push('Prior travel history is a positive factor');
  factors.travelHistoryScore = travelScore;

  // ── Interview factor ─────────────────────────────────────────────────────
  const interviewScore = mockInterviewScore * 10;
  if (mockInterviewScore < 6) {
    recommendations.push('Schedule mock interview sessions to improve confidence');
  }
  factors.interviewScore = Math.max(0, Math.min(100, interviewScore));

  // ── Refusal penalty ─────────────────────────────────────────────────────
  let refusalPenalty = 0;
  if (refusalCount > 0) {
    refusalPenalty = refusalCount * 15;
    reasons.push(`${refusalCount} prior visa refusal(s) detected — must address in application`);
    recommendations.push('Include a detailed refusal explanation and remediation letter');
  }
  factors.refusalPenalty = refusalPenalty;

  // Gap years already computed
  factors.gapYearsPenalty = gapYears * 5;

  // ── Weighted probability ─────────────────────────────────────────────────
  const raw =
    (factors.academicScore * FACTOR_WEIGHTS.academic +
      factors.languageScore * FACTOR_WEIGHTS.language +
      factors.financialScore * FACTOR_WEIGHTS.financial +
      factors.documentScore * FACTOR_WEIGHTS.documentation +
      factors.travelHistoryScore * FACTOR_WEIGHTS.travelHistory +
      factors.interviewScore * FACTOR_WEIGHTS.interview) /
    (FACTOR_WEIGHTS.academic +
      FACTOR_WEIGHTS.language +
      FACTOR_WEIGHTS.financial +
      FACTOR_WEIGHTS.documentation +
      FACTOR_WEIGHTS.travelHistory +
      FACTOR_WEIGHTS.interview);

  const visaSuccessProbability = Math.max(
    5,
    Math.min(98, Math.round(raw - refusalPenalty - factors.gapYearsPenalty))
  );

  // ── Risk category ────────────────────────────────────────────────────────
  let riskCategory;
  if (visaSuccessProbability >= 75) riskCategory = 'low';
  else if (visaSuccessProbability >= 55) riskCategory = 'medium';
  else if (visaSuccessProbability >= 35) riskCategory = 'high';
  else riskCategory = 'very_high';

  if (riskCategory === 'low')
    recommendations.push('Application looks strong — proceed with confidence');
  if (riskCategory === 'very_high')
    recommendations.push('Consider deferring intake to strengthen application');

  return {
    visaSuccessProbability,
    riskCategory,
    reasons,
    recommendations,
    factors,
  };
}

module.exports = { assessVisaRisk };
