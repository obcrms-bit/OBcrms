const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', restrict('admin', 'manager'), agentController.getAgents);
router.post('/', restrict('admin'), agentController.createAgent);
router.put('/:id', restrict('admin'), agentController.updateAgent);
router.delete('/:id', restrict('admin'), agentController.deleteAgent);

module.exports = router;
