const fs = require('fs');
const path = require('path');
const { ingestDataset } = require('../services/analyzer');
const { buildInsights } = require('../services/insights');

async function main() {
  const fixturePath = path.resolve(__dirname, 'fixtures', 'company-intelligence-sample.csv');
  const buffer = fs.readFileSync(fixturePath);

  const result = await ingestDataset({
    originalname: 'company-intelligence-sample.csv',
    mimetype: 'text/csv',
    buffer,
    size: buffer.length,
  });

  const insights = buildInsights({
    metrics: result.metrics,
    quality: result.quality,
    datasetTypes: result.datasetTypes,
  });

  const summary = {
    sourceType: result.sourceType,
    datasetTypes: result.datasetTypes,
    rowCount: result.rows.length,
    cleanedRowCount: result.normalizedRecords.length,
    duplicateCount: result.quality.duplicateCount,
    completenessRate: result.quality.completenessRate,
    conversionRate: result.metrics.conversionRate,
    totalRevenue: result.metrics.totalRevenue,
    topStage: result.metrics.topStage,
    topSource: result.metrics.topSource,
    mappedFields: result.fieldMappings
      .filter((mapping) => mapping.mappedField)
      .map((mapping) => ({
        sourceField: mapping.sourceField,
        mappedField: mapping.mappedField,
        confidence: mapping.confidence,
      })),
    insightCount: insights.insights.length,
    recommendationCount: insights.recommendations.length,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message || String(error)}\n`);
  process.exit(1);
});
