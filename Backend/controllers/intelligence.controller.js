const mongoose = require('mongoose');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const CompanyIntelligenceDataset = require('../models/CompanyIntelligenceDataset');
const CompanyIntelligenceReport = require('../models/CompanyIntelligenceReport');
const {
  processUploadedDataset,
  reanalyzeExistingDataset,
  upsertDatasetReport,
} = require('../services/companyIntelligence.service');
const { generateReportPdfBuffer } = require('../services/reportGenerator.service');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  getUserBranchIds,
  mergeFiltersWithAnd,
} = require('../services/accessControl.service');

const FRONTEND_BASE_URL = String(
  process.env.FRONTEND_URL || 'https://your-frontend-domain.vercel.app'
).replace(/\/$/, '');

const resolveBranchScope = async (req, branchId) => {
  if (!branchId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new Error('Invalid branchId');
  }

  const branch = await Branch.findOne({
    _id: branchId,
    companyId: req.companyId,
    deletedAt: null,
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  if (req.user?.effectiveAccess?.isHeadOffice) {
    return branch;
  }

  const allowedBranchIds = getUserBranchIds(req.user);
  if (!allowedBranchIds.includes(String(branch._id))) {
    throw new Error('You do not have access to this branch');
  }

  return branch;
};

const buildScopedFilter = (req, explicitBranchId = null) => {
  const companyFilter = { companyId: req.companyId, deletedAt: null };
  const branchIds = getUserBranchIds(req.user);

  if (explicitBranchId) {
    return { ...companyFilter, branchId: explicitBranchId };
  }

  if (req.user?.effectiveAccess?.isHeadOffice || !branchIds.length) {
    return companyFilter;
  }

  return mergeFiltersWithAnd(companyFilter, {
    $or: [{ branchId: null }, { branchId: { $in: branchIds } }],
  });
};

const logAudit = async (req, action, module, target, changes = {}) => {
  await AuditLog.logAction({
    companyId: req.companyId,
    branchId:
      req.user?.branchId?._id ||
      req.user?.branchId ||
      target?.branchId ||
      null,
    userId: req.user?._id || target?.generatedBy,
    userName: req.user?.name || 'System',
    userEmail: req.user?.email || '',
    userRole: req.user?.role || 'system',
    action,
    actionType: module,
    module,
    resource: module,
    resourceId: target?._id,
    targetId: target?._id,
    resourceName: target?.name || target?.title || module,
    changes,
  });
};

const datasetProjection = (dataset) => ({
  _id: dataset._id,
  name: dataset.name,
  sourceType: dataset.sourceType,
  status: dataset.status,
  originalFileName: dataset.originalFileName,
  fileSize: dataset.fileSize,
  datasetTypes: dataset.datasetTypes || [],
  rowCount: dataset.rowCount || 0,
  cleanedRowCount: dataset.cleanedRowCount || 0,
  quality: dataset.quality || {},
  metrics: dataset.metrics || {},
  previewColumns: dataset.previewColumns || [],
  previewRows: dataset.previewRows || [],
  detectedSchema: dataset.detectedSchema || [],
  insightsSnapshot: dataset.insightsSnapshot || {},
  createdAt: dataset.createdAt,
  updatedAt: dataset.updatedAt,
  analyzedAt: dataset.analyzedAt,
  branchId: dataset.branchId || null,
  uploadedBy: dataset.uploadedBy || null,
});

const reportProjection = (report) => ({
  _id: report._id,
  title: report.title,
  status: report.status,
  branding: report.branding || {},
  companyProfile: report.companyProfile || {},
  metrics: report.metrics || {},
  charts: report.charts || {},
  insights: report.insights || [],
  operationalGaps: report.operationalGaps || [],
  opportunities: report.opportunities || [],
  recommendations: report.recommendations || [],
  assistantBrief: report.assistantBrief || '',
  shareEnabled: report.shareEnabled,
  shareToken: report.shareToken,
  shareUrl:
    report.shareEnabled && report.shareToken
      ? `${FRONTEND_BASE_URL}/intelligence/share/${report.shareToken}`
      : '',
  datasetId: report.datasetId,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  lastPdfGeneratedAt: report.lastPdfGeneratedAt,
});

exports.getOverview = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const datasetFilter = buildScopedFilter(req, branch?._id || null);
    const reportFilter = buildScopedFilter(req, branch?._id || null);

    const [totalDatasets, totalReports, recentDatasets, latestReport] = await Promise.all([
      CompanyIntelligenceDataset.countDocuments(datasetFilter),
      CompanyIntelligenceReport.countDocuments(reportFilter),
      CompanyIntelligenceDataset.find(datasetFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name email')
        .lean(),
      CompanyIntelligenceReport.findOne(reportFilter)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const summary = recentDatasets.reduce(
      (accumulator, dataset) => {
        accumulator.totalRows += Number(dataset.cleanedRowCount || 0);
        accumulator.totalRevenue += Number(dataset.metrics?.totalRevenue || 0);
        accumulator.avgConversion += Number(dataset.metrics?.conversionRate || 0);
        return accumulator;
      },
      { totalRows: 0, totalRevenue: 0, avgConversion: 0 }
    );

    const averageConversion = recentDatasets.length
      ? Number((summary.avgConversion / recentDatasets.length).toFixed(1))
      : 0;

    return sendSuccess(res, 200, 'Company intelligence overview fetched successfully', {
      totals: {
        datasets: totalDatasets,
        reports: totalReports,
        records: summary.totalRows,
        revenue: Number(summary.totalRevenue.toFixed(2)),
        averageConversion,
      },
      recentDatasets: recentDatasets.map(datasetProjection),
      latestReport: latestReport ? reportProjection(latestReport) : null,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch intelligence overview', error.message);
  }
};

exports.listDatasets = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const filter = buildScopedFilter(req, branch?._id || null);

    if (req.query.sourceType) {
      filter.sourceType = String(req.query.sourceType).toLowerCase();
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { originalFileName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const datasets = await CompanyIntelligenceDataset.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email')
      .lean();

    return sendSuccess(res, 200, 'Intelligence datasets fetched successfully', {
      datasets: datasets.map(datasetProjection),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch intelligence datasets', error.message);
  }
};

exports.uploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Dataset file is required');
    }

    const company = await Company.findById(req.companyId).lean();
    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    const branch = await resolveBranchScope(req, req.body.branchId || req.query.branchId).catch(
      () => null
    );
    const datasetPayload = await processUploadedDataset({
      file: req.file,
      datasetName: req.body.name,
      company,
      branch,
      userId: req.user._id,
    });

    const dataset = await CompanyIntelligenceDataset.create(datasetPayload);
    const report = await upsertDatasetReport({
      dataset,
      company,
      branch,
      userId: req.user._id,
    });

    await logAudit(req, 'company_intelligence_uploaded', 'reports', dataset, {
      after: {
        sourceType: dataset.sourceType,
        datasetTypes: dataset.datasetTypes,
        cleanedRowCount: dataset.cleanedRowCount,
      },
    });

    return sendSuccess(res, 201, 'Dataset uploaded and analyzed successfully', {
      dataset: datasetProjection(dataset.toObject()),
      report: reportProjection(report.toObject()),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to upload and analyze dataset', error.message);
  }
};

exports.getDatasetById = async (req, res) => {
  try {
    const dataset = await CompanyIntelligenceDataset.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    })
      .populate('uploadedBy', 'name email')
      .lean();

    if (!dataset) {
      return sendError(res, 404, 'Dataset not found');
    }

    const report = await CompanyIntelligenceReport.findOne({
      companyId: req.companyId,
      datasetId: dataset._id,
      deletedAt: null,
    }).lean();

    return sendSuccess(res, 200, 'Dataset fetched successfully', {
      dataset: datasetProjection(dataset),
      report: report ? reportProjection(report) : null,
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch dataset', error.message);
  }
};

exports.reanalyzeDataset = async (req, res) => {
  try {
    const dataset = await CompanyIntelligenceDataset.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    });

    if (!dataset) {
      return sendError(res, 404, 'Dataset not found');
    }

    const company = await Company.findById(req.companyId).lean();
    const branch = dataset.branchId ? await Branch.findById(dataset.branchId).lean() : null;
    const { datasetPatch } = reanalyzeExistingDataset(dataset);

    Object.assign(dataset, datasetPatch);
    await dataset.save();

    const report = await upsertDatasetReport({
      dataset,
      company,
      branch,
      userId: req.user._id,
    });

    await logAudit(req, 'company_intelligence_reanalyzed', 'reports', dataset, {
      after: {
        cleanedRowCount: dataset.cleanedRowCount,
        datasetTypes: dataset.datasetTypes,
      },
    });

    return sendSuccess(res, 200, 'Dataset reanalyzed successfully', {
      dataset: datasetProjection(dataset.toObject()),
      report: reportProjection(report.toObject()),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to reanalyze dataset', error.message);
  }
};

exports.listReports = async (req, res) => {
  try {
    const branch = await resolveBranchScope(req, req.query.branchId).catch(() => null);
    const filter = buildScopedFilter(req, branch?._id || null);

    if (req.query.datasetId && mongoose.Types.ObjectId.isValid(req.query.datasetId)) {
      filter.datasetId = new mongoose.Types.ObjectId(req.query.datasetId);
    }

    const reports = await CompanyIntelligenceReport.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 200, 'Intelligence reports fetched successfully', {
      reports: reports.map(reportProjection),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch intelligence reports', error.message);
  }
};

exports.createDatasetReport = async (req, res) => {
  try {
    const dataset = await CompanyIntelligenceDataset.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    });

    if (!dataset) {
      return sendError(res, 404, 'Dataset not found');
    }

    const company = await Company.findById(req.companyId).lean();
    const branch = dataset.branchId ? await Branch.findById(dataset.branchId).lean() : null;
    const report = await upsertDatasetReport({
      dataset,
      company,
      branch,
      userId: req.user._id,
    });

    await logAudit(req, 'company_intelligence_report_generated', 'reports', report, {
      after: { datasetId: dataset._id },
    });

    return sendSuccess(res, 200, 'Report generated successfully', {
      report: reportProjection(report.toObject()),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to generate intelligence report', error.message);
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await CompanyIntelligenceReport.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    })
      .populate('datasetId')
      .lean();

    if (!report) {
      return sendError(res, 404, 'Report not found');
    }

    return sendSuccess(res, 200, 'Intelligence report fetched successfully', {
      report: {
        ...reportProjection(report),
        dataset: report.datasetId ? datasetProjection(report.datasetId) : null,
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch intelligence report', error.message);
  }
};

exports.shareReport = async (req, res) => {
  try {
    const report = await CompanyIntelligenceReport.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    });

    if (!report) {
      return sendError(res, 404, 'Report not found');
    }

    report.shareEnabled = req.body.shareEnabled !== false;
    report.shareExpiresAt = req.body.shareExpiresAt ? new Date(req.body.shareExpiresAt) : null;
    await report.save();

    await logAudit(req, 'company_intelligence_share_updated', 'reports', report, {
      after: {
        shareEnabled: report.shareEnabled,
        shareExpiresAt: report.shareExpiresAt,
      },
    });

    return sendSuccess(res, 200, 'Report sharing updated successfully', {
      report: reportProjection(report.toObject()),
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to update report sharing', error.message);
  }
};

exports.downloadReportPdf = async (req, res) => {
  try {
    const report = await CompanyIntelligenceReport.findOne({
      _id: req.params.id,
      ...buildScopedFilter(req),
    }).lean();

    if (!report) {
      return sendError(res, 404, 'Report not found');
    }

    const company = await Company.findById(req.companyId).lean();
    const pdfBuffer = await generateReportPdfBuffer({
      report,
      companyName: company?.name,
      frontendBaseUrl: FRONTEND_BASE_URL,
    });

    await CompanyIntelligenceReport.updateOne(
      { _id: report._id },
      { $set: { lastPdfGeneratedAt: new Date() } }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${String(report.title || 'company-intelligence-report')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    return sendError(res, 400, 'Failed to generate report PDF', error.message);
  }
};

exports.getSharedReport = async (req, res) => {
  try {
    const report = await CompanyIntelligenceReport.findOne({
      shareToken: req.params.token,
      shareEnabled: true,
      deletedAt: null,
      $or: [{ shareExpiresAt: null }, { shareExpiresAt: { $gt: new Date() } }],
    }).lean();

    if (!report) {
      return sendError(res, 404, 'Shared report not found');
    }

    const company = await Company.findById(report.companyId).lean();

    return sendSuccess(res, 200, 'Shared intelligence report fetched successfully', {
      report: reportProjection(report),
      company: {
        name: company?.name || 'Company',
      },
    });
  } catch (error) {
    return sendError(res, 400, 'Failed to fetch shared report', error.message);
  }
};
