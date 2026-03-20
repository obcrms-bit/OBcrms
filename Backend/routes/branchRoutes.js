const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', branchController.getBranches);
router.post('/', restrict('admin'), branchController.createBranch);
router.put('/:id', restrict('admin'), branchController.updateBranch);
router.delete('/:id', restrict('admin'), branchController.deleteBranch);

module.exports = router;
