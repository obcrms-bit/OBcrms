const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

// GET /activities?entityType=lead&entityId=xxx
router.get('/', activityController.getActivities);

// POST /activities (optional, for manual log)
router.post('/', activityController.createActivity);

module.exports = router;
