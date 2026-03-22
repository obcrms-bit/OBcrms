const express = require('express');
const router = express.Router();
const {
  generateRecommendations,
  toggleShortlist,
  getRecommendations
} = require('../controllers/courseAi.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// Routes for Course AI Recommendation
router.get('/:id/generate', generateRecommendations); // /api/v1/course-ai/:id/generate?type=lead
router.get('/:id', getRecommendations); // /api/v1/course-ai/:id?type=lead
router.patch('/recommendation/:id/shortlist', toggleShortlist); // /api/v1/course-ai/recommendation/:id/shortlist

module.exports = router;
