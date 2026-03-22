const express = require('express');
const router = express.Router();
const {
  getFullProfile,
  addNote,
  addCallLog,
  addOfficeVisit,
  updateProfileData
} = require('../controllers/clientProfile.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// Routes for full 360 profile
router.get('/:id', getFullProfile); // /api/v1/client-profile/:id?type=lead
router.put('/:id', updateProfileData);
router.post('/:id/notes', addNote);
router.post('/:id/calls', addCallLog);
router.post('/:id/visits', addOfficeVisit);

module.exports = router;
