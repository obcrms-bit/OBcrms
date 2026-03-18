const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/visaChecklist.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getChecklist);
router.post('/item', ctrl.addChecklistItem);
router.put('/item/:itemId', ctrl.updateChecklistItem);
router.post('/verify/:itemId', ctrl.verifyChecklistItem);
router.post('/reject/:itemId', ctrl.rejectChecklistItem);

module.exports = router;
