/**
 * Lead Scoring Service — deterministic, extensible
 * Returns: { score, category, breakdown }
 */

const WEIGHTS = {
  email: 10,
  phone: 10,
  whatsapp: 5,
  preferredCountry: 15,
  studyLevel: 10,
  intake: 8,
  budget: 10,
  education: 12,
  englishTest: 15,
  tags: 5,
  followUpScheduled: 5,
  notesOrActivity: 5,
};

/**
 * @param {Object} lead - full lead document
 * @returns {{ score: number, category: 'hot'|'warm'|'cold', breakdown: Object }}
 */
function calculateLeadScore(lead) {
  const breakdown = {};
  let score = 0;

  // Email
  breakdown.email = lead.email ? WEIGHTS.email : 0;
  score += breakdown.email;

  // Phone
  breakdown.phone = lead.phone ? WEIGHTS.phone : 0;
  score += breakdown.phone;

  // WhatsApp
  breakdown.whatsapp = lead.whatsappNumber ? WEIGHTS.whatsapp : 0;
  score += breakdown.whatsapp;

  // Preferred country
  const hasPrefCountry = Array.isArray(lead.preferredCountries)
    ? lead.preferredCountries.length > 0
    : !!lead.interestedCountry;
  breakdown.preferredCountry = hasPrefCountry ? WEIGHTS.preferredCountry : 0;
  score += breakdown.preferredCountry;

  // Study level
  breakdown.studyLevel = lead.preferredStudyLevel ? WEIGHTS.studyLevel : 0;
  score += breakdown.studyLevel;

  // Intake
  breakdown.intake = lead.preferredIntake ? WEIGHTS.intake : 0;
  score += breakdown.intake;

  // Budget
  breakdown.budget = lead.budget && lead.budget > 0 ? WEIGHTS.budget : 0;
  score += breakdown.budget;

  // Education
  const hasEdu = lead.education && (lead.education.lastDegree || lead.education.percentage);
  breakdown.education = hasEdu ? WEIGHTS.education : 0;
  score += breakdown.education;

  // English test
  const hasEnglish =
    lead.englishTest &&
    lead.englishTest.type &&
    lead.englishTest.type !== 'none' &&
    lead.englishTest.score;
  breakdown.englishTest = hasEnglish ? WEIGHTS.englishTest : 0;
  score += breakdown.englishTest;

  // Tags (engaged)
  breakdown.tags = Array.isArray(lead.tags) && lead.tags.length > 0 ? WEIGHTS.tags : 0;
  score += breakdown.tags;

  // Follow-up scheduled
  const hasFU = lead.nextFollowUp && new Date(lead.nextFollowUp) > new Date();
  breakdown.followUpScheduled = hasFU ? WEIGHTS.followUpScheduled : 0;
  score += breakdown.followUpScheduled;

  // Notes / activity
  const hasActivity =
    (lead.notes && lead.notes.length > 0) || (lead.activities && lead.activities.length > 1);
  breakdown.notesOrActivity = hasActivity ? WEIGHTS.notesOrActivity : 0;
  score += breakdown.notesOrActivity;

  // Clamp to 100
  score = Math.min(100, score);

  // Category
  let category = 'cold';
  if (score >= 70) category = 'hot';
  else if (score >= 40) category = 'warm';

  return { score, category, breakdown };
}

module.exports = { calculateLeadScore };
