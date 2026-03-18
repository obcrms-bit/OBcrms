const Lead = require('../models/Lead');
const Student = require('../models/Student');
const Activity = require('../models/Activity');
const { calculateLeadScore } = require('../utils/leadScoring');

class LeadService {
  // Fetch all leads with filtering and pagination
  async getLeads(companyId, filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      source,
      counsellor,
      branch,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      fromDate,
      toDate,
    } = filters;

    const query = { companyId, deletedAt: null };

    if (status) query.status = status;
    if (source) query.source = source;
    if (counsellor) query.assignedCounsellor = counsellor;
    if (branch) query.branchId = branch;
    if (category) query.leadCategory = category;

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .select('-activities -notes')
        .populate('assignedCounsellor', 'name email')
        .populate('branchId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Lead.countDocuments(query),
    ]);

    return {
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  // Create a new lead
  async createLead(companyId, leadData, performedBy) {
    const newLead = new Lead({
      ...leadData,
      companyId,
      score: calculateLeadScore(leadData),
      status: 'new',
    });

    await newLead.save();

    // Log activity
    await this.logActivity(
      companyId,
      newLead._id,
      'CREATE',
      `Lead ${newLead.firstName} ${newLead.lastName} created`,
      performedBy
    );

    return newLead.populate('assignedCounsellor', 'name email');
  }

  // Get lead by ID
  async getLeadById(companyId, leadId) {
    const lead = await Lead.findOne({
      _id: leadId,
      companyId,
      deletedAt: null,
    })
      .populate('assignedCounsellor', 'name email')
      .populate('branchId', 'name');

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  // Update lead
  async updateLead(companyId, leadId, updateData, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Update fields
    Object.assign(lead, updateData);

    // Recalculate score if relevant data changed
    if (updateData.firstName || updateData.email || updateData.phone || updateData.source) {
      lead.score = calculateLeadScore(lead);
    }

    await lead.save();

    // Log activity
    await this.logActivity(companyId, leadId, 'UPDATE', 'Lead updated', performedBy, {
      fields: Object.keys(updateData),
    });

    return lead.populate('assignedCounsellor', 'name email');
  }

  // Delete lead (soft delete)
  async deleteLead(companyId, leadId, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.deletedAt = new Date();
    await lead.save();

    // Log activity
    await this.logActivity(companyId, leadId, 'DELETE', 'Lead deleted', performedBy);
  }

  // Update lead status
  async updateLeadStatus(companyId, leadId, newStatus, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const oldStatus = lead.status;
    lead.status = newStatus;
    await lead.save();

    // Log activity
    await this.logActivity(
      companyId,
      leadId,
      'STATUS_CHANGE',
      `Status changed from ${oldStatus} to ${newStatus}`,
      performedBy,
      { oldStatus, newStatus }
    );

    return lead;
  }

  // Get pipeline view
  async getPipeline(companyId, branch = null) {
    const query = { companyId, deletedAt: null };
    if (branch) query.branchId = branch;

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalScore: { $sum: '$score' },
          leads: { $push: { _id: '$_id', firstName: '$firstName', lastName: '$lastName' } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    return Lead.aggregate(pipeline);
  }

  // Convert lead to student
  async convertToStudent(companyId, leadId, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    if (lead.convertedToStudentAt) {
      throw new Error('Lead already converted to student');
    }

    // Create student record
    const student = new Student({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      companyId,
      source: lead.source,
      counsellorId: lead.assignedCounsellor,
      branchId: lead.branchId,
      leadId: lead._id,
    });

    await student.save();

    // Mark lead as converted
    lead.convertedToStudentAt = new Date();
    lead.status = 'converted';
    await lead.save();

    // Log activity
    await this.logActivity(
      companyId,
      leadId,
      'CONVERSION',
      `Lead converted to student ${student._id}`,
      performedBy,
      { studentId: student._id }
    );

    return student;
  }

  // Assign counsellor to lead
  async assignCounsellor(companyId, leadId, counsellorId, reason, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const oldCounsellor = lead.assignedCounsellor;
    lead.assignedCounsellor = counsellorId;
    lead.assignmentReason = reason;
    lead.assignedAt = new Date();

    await lead.save();

    // Log activity
    await this.logActivity(
      companyId,
      leadId,
      'ASSIGNMENT',
      'Lead assigned to counsellor',
      performedBy,
      { oldCounsellor, newCounsellor: counsellorId, reason }
    );

    return lead.populate('assignedCounsellor', 'name email');
  }

  // Schedule follow-up
  async scheduleFollowUp(companyId, leadId, followUpData, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    lead.followUps = lead.followUps || [];
    lead.followUps.push({
      ...followUpData,
      scheduledBy: performedBy,
      createdAt: new Date(),
      status: 'scheduled',
    });

    await lead.save();

    // Log activity
    await this.logActivity(
      companyId,
      leadId,
      'FOLLOWUP_SCHEDULED',
      `Follow-up scheduled for ${followUpData.date}`,
      performedBy,
      { date: followUpData.date }
    );

    return lead;
  }

  // Get due follow-ups
  async getDueFollowUps(companyId) {
    return Lead.find({
      companyId,
      deletedAt: null,
      'followUps.dueDate': { $lte: new Date() },
      'followUps.status': 'scheduled',
    }).select('firstName lastName email assignedCounsellor followUps');
  }

  // Recalculate lead score
  async recalculateScore(companyId, leadId, performedBy) {
    const lead = await Lead.findOne({ _id: leadId, companyId, deletedAt: null });

    if (!lead) {
      throw new Error('Lead not found');
    }

    const oldScore = lead.score;
    lead.score = calculateLeadScore(lead);
    await lead.save();

    // Log activity
    await this.logActivity(
      companyId,
      leadId,
      'SCORE_RECALCULATION',
      `Score recalculated from ${oldScore} to ${lead.score}`,
      performedBy,
      { oldScore, newScore: lead.score }
    );

    return lead;
  }

  // Log activity
  async logActivity(companyId, entityId, action, description, performedBy, metadata = {}) {
    try {
      await Activity.create({
        companyId,
        module: 'crm',
        entityType: 'lead',
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

module.exports = new LeadService();
