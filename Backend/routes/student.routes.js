const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { protect, restrict } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', restrict('admin', 'manager', 'counselor'), studentController.getStudents);
router.post('/', restrict('admin', 'manager', 'counselor'), studentController.createStudent);
router.get('/:id', restrict('admin', 'manager', 'counselor'), studentController.getStudentById);
router.put('/:id', restrict('admin', 'manager'), studentController.updateStudent);
router.delete('/:id', restrict('admin', 'manager'), studentController.deleteStudent);
router.patch(
  '/:id/status',
  restrict('admin', 'manager', 'counselor'),
  studentController.updateStudentStatus
);

module.exports = router;
