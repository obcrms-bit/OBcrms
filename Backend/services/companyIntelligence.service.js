const crypto = require('crypto');
const CompanyIntelligenceReport = require('../models/CompanyIntelligenceReport');
const { ingestDataset, reanalyzeDatasetRecords } = require('./analyzer');
const { buildInsights } = require('./insights');
const { getEffectiveBranding } = require('../utils/branding');

const createShareToken = () => crypto.randomBytes(24).toString('hex');

const toPlainObject = (value) => (value?.toObject ? value.toObject() : value);

exports.processUploadedDataset = async ({
  file,
  datasetName,
  company,
  branch = null,
  userId,
}) => {
  const analysis = await ingestDataset(file);
  const insightsBundle = buildInsights({
    metrics: analysis.metrics,
    quality: analysis.quality,
    datasetTypes: analysis.datasetTypes,
  });

  return {
    companyId: company._id,
    branchId: branch?._id || null,
    name: datasetName || String(file.originalname || 'Company dataset').replace(/\.[^.]+$/, ''),
    sourceType: analysis.sourceType,
    status: 'analyzed',
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size || file.buffer?.length || 0,
    uploadedBy: userId,
    datasetTypes: analysis.datasetTypes,
    detectedSchema: analysis.fieldMappings,
    previewColumns: analysis.previewColumns,
    previewRows: analysis.previewRows,
    normalizedRecords: analysis.normalizedRecords,
    rawExtract: {
      text: analysis.rawText,
      headers: analysis.rows.length ? Object.keys(analysis.rows[0] || {}) : [],
    },
    quality: analysis.quality,
    metrics: analysis.metrics,
    insightsSnapshot: {
      companyProfile: analysis.companyProfile,
      operationalGaps: insightsBundle.operationalGaps,
      opportunities: insightsBundle.opportunities,
      insights: insightsBundle.insights,
      recommendations: insightsBundle.recommendations,
      charts: {
        stageBreakdown: analysis.metrics.stageBreakdown || [],
        sourceBreakdown: analysis.metrics.sourceBreakdown || [],
        branchBreakdown: analysis.metrics.branchBreakdown || [],
        monthlyTrend: analysis.metrics.monthlyTrend || [],
        revenueTrend: analysis.metrics.revenueTrend || [],
        leadQualityBreakdown: analysis.metrics.leadQualityBreakdown || [],
      },
      assistantBrief: insightsBundle.assistantBrief,
    },
    rowCount: analysis.rows.length,
    cleanedRowCount: analysis.normalizedRecords.length,
    analyzedAt: new Date(),
  };
};

exports.reanalyzeExistingDataset = (datasetDocument) => {
  const dataset = toPlainObject(datasetDocument);
  const analysis = reanalyzeDatasetRecords({
    normalizedRecords: dataset.normalizedRecords || [],
    sourceType: dataset.sourceType,
    rawText: dataset.rawExtract?.text || '',
    explicitHeaders: dataset.rawExtract?.headers || [],
  });
  const insightsBundle = buildInsights({
    metrics: analysis.metrics,
    quality: analysis.quality,
    datasetTypes: analysis.datasetTypes,
  });

  return {
    datasetPatch: {
      datasetTypes: analysis.datasetTypes,
      detectedSchema: analysis.fieldMappings,
      previewColumns: analysis.previewColumns,
      previewRows: analysis.previewRows,
      quality: analysis.quality,
      metrics: analysis.metrics,
      insightsSnapshot: {
        companyProfile: analysis.companyProfile,
        operationalGaps: insightsBundle.operationalGaps,
        opportunities: insightsBundle.opportunities,
        insights: insightsBundle.insights,
        recommendations: insightsBundle.recommendations,
        charts: {
          stageBreakdown: analysis.metrics.stageBreakdown || [],
          sourceBreakdown: analysis.metrics.sourceBreakdown || [],
          branchBreakdown: analysis.metrics.branchBreakdown || [],
          monthlyTrend: analysis.metrics.monthlyTrend || [],
          revenueTrend: analysis.metrics.revenueTrend || [],
          leadQualityBreakdown: analysis.metrics.leadQualityBreakdown || [],
        },
        assistantBrief: insightsBundle.assistantBrief,
      },
      cleanedRowCount: (dataset.normalizedRecords || []).length,
      analyzedAt: new Date(),
      status: 'analyzed',
    },
    reportPatch: {
      metrics: analysis.metrics,
      charts: {
        stageBreakdown: analysis.metrics.stageBreakdown || [],
        sourceBreakdown: analysis.metrics.sourceBreakdown || [],
        branchBreakdown: analysis.metrics.branchBreakdown || [],
        monthlyTrend: analysis.metrics.monthlyTrend || [],
        revenueTrend: analysis.metrics.revenueTrend || [],
        leadQualityBreakdown: analysis.metrics.leadQualityBreakdown || [],
      },
      companyProfile: analysis.companyProfile,
      insights: insightsBundle.insights,
      operationalGaps: insightsBundle.operationalGaps,
      opportunities: insightsBundle.opportunities,
      recommendations: insightsBundle.recommendations,
      assistantBrief: insightsBundle.assistantBrief,
    },
  };
};

exports.upsertDatasetReport = async ({
  dataset,
  company,
  branch = null,
  userId,
}) => {
  const branding = getEffectiveBranding(company, branch);
  const reportPayload = {
    title: `${company.name} Intelligence Report`,
    branding,
    companyProfile: {
      ...(dataset.insightsSnapshot?.companyProfile || {}),
      headline:
        dataset.insightsSnapshot?.companyProfile?.headline ||
        `Operational intelligence generated from ${dataset.cleanedRowCount || 0} cleaned records.`,
    },
    metrics: dataset.metrics || {},
    charts: dataset.insightsSnapshot?.charts || {},
    insights: dataset.insightsSnapshot?.insights || [],
    operationalGaps: dataset.insightsSnapshot?.operationalGaps || [],
    opportunities: dataset.insightsSnapshot?.opportunities || [],
    recommendations: dataset.insightsSnapshot?.recommendations || [],
    assistantBrief: dataset.insightsSnapshot?.assistantBrief || '',
  };

  const existingReport = await CompanyIntelligenceReport.findOne({
    companyId: company._id,
    datasetId: dataset._id,
    deletedAt: null,
  });

  if (existingReport) {
    existingReport.title = reportPayload.title;
    existingReport.branding = reportPayload.branding;
    existingReport.companyProfile = reportPayload.companyProfile;
    existingReport.metrics = reportPayload.metrics;
    existingReport.charts = reportPayload.charts;
    existingReport.insights = reportPayload.insights;
    existingReport.operationalGaps = reportPayload.operationalGaps;
    existingReport.opportunities = reportPayload.opportunities;
    existingReport.recommendations = reportPayload.recommendations;
    existingReport.assistantBrief = reportPayload.assistantBrief;
    if (!existingReport.shareToken) {
      existingReport.shareToken = createShareToken();
    }
    await existingReport.save();
    return existingReport;
  }

  return CompanyIntelligenceReport.create({
    companyId: company._id,
    branchId: branch?._id || null,
    datasetId: dataset._id,
    generatedBy: userId,
    shareToken: createShareToken(),
    shareEnabled: true,
    ...reportPayload,
  });
};
