const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);
router.get('/profile', companyController.getCompanyProfile);
router.patch('/profile', restrict('admin'), companyController.updateCompanyProfile);

module.exports = router;
