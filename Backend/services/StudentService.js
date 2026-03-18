const Student = require('../models/Student');
const Activity = require('../models/Activity');

class StudentService {
  // Fetch all students with pagination and filtering
  async getStudents(companyId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      branch,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const query = { companyId, isActive: true };

    if (status) query.admissionStatus = status;
    if (branch) query.branchId = branch;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('counsellorId', 'name email')
        .populate('branchId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Student.countDocuments(query),
    ]);

    return {
      students,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Create a new student
  async createStudent(companyId, studentData, performedBy) {
    // Auto-generate registration number if not provided
    if (!studentData.registrationNumber) {
      const count = await Student.countDocuments({ companyId });
      studentData.registrationNumber = `STU-${Date.now()}-${count + 1}`;
    }

    const newStudent = new Student({
      ...studentData,
      companyId,
      admissionStatus: studentData.admissionStatus || 'pending',
      isActive: true,
    });

    await newStudent.save();

    // Log activity
    await this.logActivity(
      companyId,
      newStudent._id,
      'CREATE',
      `Student ${newStudent.firstName} ${newStudent.lastName} created`,
      performedBy
    );

    return newStudent.populate('counsellorId', 'name email');
  }

  // Get student by ID
  async getStudentById(companyId, studentId) {
    const student = await Student.findOne({
      _id: studentId,
      companyId,
      isActive: true,
    })
      .populate('counsellorId', 'name email')
      .populate('branchId', 'name')
      .populate('leadId');

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  // Update student
  async updateStudent(companyId, studentId, updateData, performedBy) {
    const student = await Student.findOne({
      _id: studentId,
      companyId,
      isActive: true,
    });

    if (!student) {
      throw new Error('Student not found');
    }

    Object.assign(student, updateData);
    await student.save();

    // Log activity
    await this.logActivity(companyId, studentId, 'UPDATE', 'Student updated', performedBy, {
      fields: Object.keys(updateData),
    });

    return student.populate('counsellorId', 'name email');
  }

  // Deactivate student (soft delete)
  async deleteStudent(companyId, studentId, performedBy) {
    const student = await Student.findOne({
      _id: studentId,
      companyId,
      isActive: true,
    });

    if (!student) {
      throw new Error('Student not found');
    }

    student.isActive = false;
    student.deactivatedAt = new Date();
    await student.save();

    // Log activity
    await this.logActivity(companyId, studentId, 'DELETE', 'Student deactivated', performedBy);
  }

  // Update admission status
  async updateAdmissionStatus(companyId, studentId, newStatus, performedBy) {
    const student = await Student.findOne({
      _id: studentId,
      companyId,
      isActive: true,
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const oldStatus = student.admissionStatus;
    student.admissionStatus = newStatus;

    // Update timestamps based on status
    if (newStatus === 'admitted') {
      student.admittedAt = new Date();
    } else if (newStatus === 'rejected') {
      student.rejectedAt = new Date();
    }

    await student.save();

    // Log activity
    await this.logActivity(
      companyId,
      studentId,
      'STATUS_CHANGE',
      `Admission status changed from ${oldStatus} to ${newStatus}`,
      performedBy,
      { oldStatus, newStatus }
    );

    return student;
  }

  // Upload document
  async uploadDocument(companyId, studentId, documentType, documentUrl, performedBy) {
    const student = await Student.findOne({
      _id: studentId,
      companyId,
      isActive: true,
    });

    if (!student) {
      throw new Error('Student not found');
    }

    student.documents = student.documents || [];
    student.documents.push({
      type: documentType,
      url: documentUrl,
      uploadedAt: new Date(),
      uploadedBy: performedBy,
    });

    await student.save();

    // Log activity
    await this.logActivity(
      companyId,
      studentId,
      'DOCUMENT_UPLOADED',
      `Document uploaded: ${documentType}`,
      performedBy,
      { documentType }
    );

    return student;
  }

  // Get student statistics
  async getStatistics(companyId, branch = null) {
    const query = { companyId, isActive: true };
    if (branch) query.branchId = branch;

    const stats = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      byStatus: stats,
    };
  }

  // Get students by lead (students created from leads)
  async getStudentsByLead(companyId, leadId) {
    return Student.find({
      companyId,
      leadId,
      isActive: true,
    }).populate('counsellorId', 'name email');
  }

  // Log activity
  async logActivity(companyId, entityId, action, description, performedBy, metadata = {}) {
    try {
      await Activity.create({
        companyId,
        module: 'crm',
        entityType: 'student',
        entityId,
        action,
        description,
        performedBy,
        metadata,
      });
    } catch (error) {
      console.error('Activity log error:', error.message);
    }
  }
}

module.exports = new StudentService();
