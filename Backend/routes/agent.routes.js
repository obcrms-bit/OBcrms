const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const { protect, requirePermission } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', requirePermission('users', 'view'), agentController.getAgents);
router.post('/', requirePermission('users', 'edit'), agentController.createAgent);
router.put('/:id', requirePermission('users', 'edit'), agentController.updateAgent);
router.delete('/:id', requirePermission('users', 'manage'), agentController.deleteAgent);

module.exports = router;
