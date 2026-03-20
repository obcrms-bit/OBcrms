const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const {
  enforceLimit,
  protect,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', requirePermission('branches', 'view'), branchController.getBranches);
router.post(
  '/',
  enforceLimit('branches'),
  requirePermission('branches', 'create'),
  branchController.createBranch
);
router.put('/:id', requirePermission('branches', 'edit'), branchController.updateBranch);
router.delete('/:id', requirePermission('branches', 'manage'), branchController.deleteBranch);

module.exports = router;
