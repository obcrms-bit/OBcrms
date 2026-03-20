const University = require('../models/University');
const Course = require('../models/Course');
const BulkImportLog = require('../models/BulkImportLog');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const normalizeString = (value) => {
  if (value === null || typeof value === 'undefined') {
    return '';
  }
  return String(value).trim();
};

const buildUniversityFilter = (companyId, query) => {
  const filter = { companyId };
  if (query.active !== undefined) {
    filter.isActive = String(query.active) !== 'false';
  }
  if (query.country) {
    filter.country = { $regex: query.country, $options: 'i' };
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { country: { $regex: query.search, $options: 'i' } },
      { city: { $regex: query.search, $options: 'i' } },
    ];
  }
  return filter;
};

const buildCourseFilter = async (companyId, query) => {
  const filter = { companyId };
  if (query.active !== undefined) {
    filter.isActive = String(query.active) !== 'false';
  }
  if (query.country) {
    filter.country = { $regex: query.country, $options: 'i' };
  }
  if (query.level) {
    filter.level = { $regex: query.level, $options: 'i' };
  }
  if (query.discipline) {
    filter.discipline = { $regex: query.discipline, $options: 'i' };
  }
  if (query.feeMax) {
    filter.feeAmount = { $lte: Number(query.feeMax) };
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { discipline: { $regex: query.search, $options: 'i' } },
      { country: { $regex: query.search, $options: 'i' } },
      { keywords: { $elemMatch: { $regex: query.search, $options: 'i' } } },
    ];
  }

  if (query.university) {
    const universities = await University.find({
      companyId,
      name: { $regex: query.university, $options: 'i' },
    })
      .select('_id')
      .lean();
    filter.universityId = { $in: universities.map((item) => item._id) };
  }

  return filter;
};

const validateImportRows = (module, rows) => {
  const errors = [];
  const normalizedRows = Array.isArray(rows) ? rows : [];

  normalizedRows.forEach((row, index) => {
    if (module === 'universities') {
      if (!normalizeString(row.name) || !normalizeString(row.country)) {
        errors.push({
          rowNumber: index + 1,
          message: 'University rows require name and country',
          raw: row,
        });
      }
    }

    if (module === 'courses') {
      if (!normalizeString(row.name) || !normalizeString(row.universityName)) {
        errors.push({
          rowNumber: index + 1,
          message: 'Course rows require name and universityName',
          raw: row,
        });
      }
    }
  });

  return {
    totalRows: normalizedRows.length,
    validRows: normalizedRows.length - errors.length,
    errors,
  };
};

exports.getUniversities = async (req, res) => {
  try {
    const universities = await University.find(buildUniversityFilter(req.companyId, req.query)).sort({
      country: 1,
      name: 1,
    });
    return sendSuccess(res, 200, 'Universities fetched successfully', { universities });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch universities', error.message);
  }
};

exports.createUniversity = async (req, res) => {
  try {
    const university = await University.findOneAndUpdate(
      {
        companyId: req.companyId,
        name: normalizeString(req.body.name),
        country: normalizeString(req.body.country),
      },
      {
        $set: {
          code: normalizeString(req.body.code),
          city: normalizeString(req.body.city),
          website: normalizeString(req.body.website),
          intakeMonths: Array.isArray(req.body.intakeMonths) ? req.body.intakeMonths : [],
          scholarshipInfo: normalizeString(req.body.scholarshipInfo),
          englishRequirements: normalizeString(req.body.englishRequirements),
          notes: normalizeString(req.body.notes),
          tags: Array.isArray(req.body.tags) ? req.body.tags : [],
          isActive: req.body.isActive !== false,
        },
        $setOnInsert: {
          companyId: req.companyId,
          name: normalizeString(req.body.name),
          country: normalizeString(req.body.country),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, 201, 'University saved successfully', { university });
  } catch (error) {
    return sendError(res, 400, 'Failed to save university', error.message);
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const university = await University.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!university) {
      return sendError(res, 404, 'University not found');
    }
    return sendSuccess(res, 200, 'University updated successfully', { university });
  } catch (error) {
    return sendError(res, 400, 'Failed to update university', error.message);
  }
};

exports.getCourses = async (req, res) => {
  try {
    const filter = await buildCourseFilter(req.companyId, req.query);
    const courses = await Course.find(filter)
      .populate('universityId', 'name country city')
      .sort({ name: 1 });
    return sendSuccess(res, 200, 'Courses fetched successfully', { courses });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch courses', error.message);
  }
};

exports.createCourse = async (req, res) => {
  try {
    const university = await University.findOne({
      _id: req.body.universityId,
      companyId: req.companyId,
    });
    if (!university) {
      return sendError(res, 404, 'University not found');
    }

    const course = await Course.findOneAndUpdate(
      {
        companyId: req.companyId,
        universityId: university._id,
        name: normalizeString(req.body.name),
        level: normalizeString(req.body.level),
      },
      {
        $set: {
          discipline: normalizeString(req.body.discipline),
          duration: normalizeString(req.body.duration),
          feeAmount: Number(req.body.feeAmount || 0),
          currency: normalizeString(req.body.currency || 'USD') || 'USD',
          intakeMonths: Array.isArray(req.body.intakeMonths) ? req.body.intakeMonths : [],
          englishRequirement: normalizeString(req.body.englishRequirement),
          scholarshipAvailable: Boolean(req.body.scholarshipAvailable),
          budgetBand: normalizeString(req.body.budgetBand),
          country: normalizeString(req.body.country || university.country),
          campus: normalizeString(req.body.campus || university.city),
          keywords: Array.isArray(req.body.keywords) ? req.body.keywords : [],
          isActive: req.body.isActive !== false,
        },
        $setOnInsert: {
          companyId: req.companyId,
          universityId: university._id,
          name: normalizeString(req.body.name),
          level: normalizeString(req.body.level),
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('universityId', 'name country city');

    return sendSuccess(res, 201, 'Course saved successfully', { course });
  } catch (error) {
    return sendError(res, 400, 'Failed to save course', error.message);
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('universityId', 'name country city');
    if (!course) {
      return sendError(res, 404, 'Course not found');
    }
    return sendSuccess(res, 200, 'Course updated successfully', { course });
  } catch (error) {
    return sendError(res, 400, 'Failed to update course', error.message);
  }
};

exports.previewBulkImport = async (req, res) => {
  try {
    const { module, rows, fileName } = req.body;
    if (!['universities', 'courses'].includes(module)) {
      return sendError(res, 400, 'Only universities and courses bulk imports are supported');
    }

    const preview = validateImportRows(module, rows);
    const log = await BulkImportLog.create({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId || null,
      module,
      mode: 'preview',
      fileName: normalizeString(fileName),
      status: preview.errors.length ? 'failed' : 'completed',
      totalRows: preview.totalRows,
      successCount: preview.validRows,
      failedCount: preview.errors.length,
      rowErrors: preview.errors,
      previewSummary: preview,
      executedBy: req.user?._id,
    });

    return sendSuccess(res, 200, 'Bulk import preview generated', { preview, log });
  } catch (error) {
    return sendError(res, 400, 'Failed to preview import', error.message);
  }
};

exports.executeBulkImport = async (req, res) => {
  try {
    const { module, rows, fileName } = req.body;
    if (!['universities', 'courses'].includes(module)) {
      return sendError(res, 400, 'Only universities and courses bulk imports are supported');
    }

    const preview = validateImportRows(module, rows);
    const importLog = await BulkImportLog.create({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId || null,
      module,
      mode: 'execute',
      fileName: normalizeString(fileName),
      status: 'pending',
      totalRows: preview.totalRows,
      successCount: 0,
      failedCount: preview.errors.length,
      rowErrors: preview.errors,
      previewSummary: preview,
      executedBy: req.user?._id,
    });

    let successCount = 0;

    for (const row of rows || []) {
      if (module === 'universities') {
        if (!normalizeString(row.name) || !normalizeString(row.country)) {
          continue;
        }

        await University.findOneAndUpdate(
          {
            companyId: req.companyId,
            name: normalizeString(row.name),
            country: normalizeString(row.country),
          },
          {
            $set: {
              code: normalizeString(row.code),
              city: normalizeString(row.city),
              website: normalizeString(row.website),
              intakeMonths: Array.isArray(row.intakeMonths) ? row.intakeMonths : [],
              scholarshipInfo: normalizeString(row.scholarshipInfo),
              englishRequirements: normalizeString(row.englishRequirements),
              isActive: row.isActive !== false,
            },
            $setOnInsert: {
              companyId: req.companyId,
            },
          },
          { upsert: true, runValidators: true }
        );
        successCount += 1;
      }

      if (module === 'courses') {
        if (!normalizeString(row.name) || !normalizeString(row.universityName)) {
          continue;
        }

        const university = await University.findOneAndUpdate(
          {
            companyId: req.companyId,
            name: normalizeString(row.universityName),
            country: normalizeString(row.country || 'Unknown'),
          },
          {
            $setOnInsert: {
              companyId: req.companyId,
              name: normalizeString(row.universityName),
              country: normalizeString(row.country || 'Unknown'),
            },
          },
          { upsert: true, new: true, runValidators: true }
        );

        await Course.findOneAndUpdate(
          {
            companyId: req.companyId,
            universityId: university._id,
            name: normalizeString(row.name),
            level: normalizeString(row.level),
          },
          {
            $set: {
              discipline: normalizeString(row.discipline),
              duration: normalizeString(row.duration),
              feeAmount: Number(row.feeAmount || 0),
              currency: normalizeString(row.currency || 'USD') || 'USD',
              intakeMonths: Array.isArray(row.intakeMonths) ? row.intakeMonths : [],
              englishRequirement: normalizeString(row.englishRequirement),
              scholarshipAvailable: Boolean(row.scholarshipAvailable),
              budgetBand: normalizeString(row.budgetBand),
              country: normalizeString(row.country || university.country),
              campus: normalizeString(row.campus || university.city),
              keywords: Array.isArray(row.keywords) ? row.keywords : [],
              isActive: row.isActive !== false,
            },
            $setOnInsert: {
              companyId: req.companyId,
            },
          },
          { upsert: true, runValidators: true }
        );
        successCount += 1;
      }
    }

    importLog.status = preview.errors.length && !successCount ? 'failed' : 'completed';
    importLog.successCount = successCount;
    importLog.failedCount = Math.max(importLog.failedCount, preview.totalRows - successCount);
    await importLog.save();

    await AuditLog.logAction({
      companyId: req.companyId,
      branchId: req.user?.branchId?._id || req.user?.branchId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'bulk_import_executed',
      actionType: 'import',
      module: 'imports',
      resource: module,
      resourceId: importLog._id,
      targetId: importLog._id,
      resourceName: normalizeString(fileName || module),
      changes: { after: { module, totalRows: preview.totalRows, successCount } },
    });

    return sendSuccess(res, 200, 'Bulk import executed successfully', {
      log: importLog,
      summary: {
        totalRows: preview.totalRows,
        successCount,
        failedCount: importLog.failedCount,
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to execute bulk import', error.message);
  }
};

exports.getImportLogs = async (req, res) => {
  try {
    const logs = await BulkImportLog.find({ companyId: req.companyId })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit || 50));
    return sendSuccess(res, 200, 'Import logs fetched successfully', { logs });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch import logs', error.message);
  }
};
