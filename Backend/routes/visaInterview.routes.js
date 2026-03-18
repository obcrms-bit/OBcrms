const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/visaInterview.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getInterview);
router.post('/schedule', ctrl.scheduleInterview);
router.post('/complete', ctrl.completeInterview);

module.exports = router;
