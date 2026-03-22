const toNumber = (value) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

const asPercent = (value) => `${Math.round(toNumber(value))}%`;

const buildItem = (title, description, priority = 'medium', metricKey = '', metricValue = null) => ({
  title,
  description,
  priority,
  metricKey,
  metricValue,
});

const dedupeByTitle = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}|${item.description}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

exports.buildInsights = ({ metrics = {}, quality = {}, datasetTypes = [] }) => {
  const insights = [];
  const operationalGaps = [];
  const opportunities = [];
  const recommendations = [];

  const conversionRate = toNumber(metrics.conversionRate);
  const completenessRate = toNumber(quality.completenessRate);
  const duplicateCount = toNumber(quality.duplicateCount);
  const missingFields = Object.entries(quality.missingValueCounts || {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  if (conversionRate > 0) {
    insights.push(
      buildItem(
        'Conversion performance snapshot',
        `The dataset indicates an overall conversion rate of ${asPercent(
          conversionRate
        )}, based on ${metrics.totalRecords || 0} analyzed records.`,
        conversionRate >= 25 ? 'low' : conversionRate >= 12 ? 'medium' : 'high',
        'conversionRate',
        conversionRate
      )
    );
  }

  if (conversionRate > 0 && conversionRate < 12) {
    operationalGaps.push(
      buildItem(
        'Conversion is dropping too early',
        'The funnel suggests leads are entering the system but not progressing efficiently into converted students or clients.',
        'high',
        'conversionRate',
        conversionRate
      )
    );
    recommendations.push(
      buildItem(
        'Strengthen mid-funnel follow-up discipline',
        'Introduce stricter follow-up SLAs, stage-exit criteria, and counsellor coaching for the stages with the biggest drop-off.',
        'high',
        'conversionRate',
        conversionRate
      )
    );
  }

  if (completenessRate < 85) {
    operationalGaps.push(
      buildItem(
        'Data quality needs attention',
        `Only ${asPercent(
          completenessRate
        )} of expected core values are populated, which reduces reporting reliability and automation quality.`,
        completenessRate < 70 ? 'high' : 'medium',
        'completenessRate',
        completenessRate
      )
    );
    recommendations.push(
      buildItem(
        'Make intake capture more structured',
        'Tighten mandatory fields for owner, stage, source, and contact data so reporting and assignments become more dependable.',
        'medium',
        'completenessRate',
        completenessRate
      )
    );
  } else {
    insights.push(
      buildItem(
        'Data completeness is healthy',
        `Core intelligence fields are ${asPercent(
          completenessRate
        )} complete, which is strong enough for reliable dashboards and operational monitoring.`,
        'low',
        'completenessRate',
        completenessRate
      )
    );
  }

  if (duplicateCount > 0) {
    operationalGaps.push(
      buildItem(
        'Duplicate records were found in the upload',
        `${duplicateCount} duplicate rows were removed during cleanup. This points to fragmented acquisition channels or repeat manual entry.`,
        duplicateCount > 15 ? 'high' : 'medium',
        'duplicateCount',
        duplicateCount
      )
    );
    recommendations.push(
      buildItem(
        'Standardize deduplication rules at intake',
        'Match incoming records on email, mobile, and external IDs before creating new records to reduce operator confusion.',
        'medium',
        'duplicateCount',
        duplicateCount
      )
    );
  }

  if (metrics.totalRevenue > 0) {
    insights.push(
      buildItem(
        'Revenue visibility is available',
        `The uploaded data contains ${metrics.currency || 'USD'} ${Math.round(
          metrics.totalRevenue
        ).toLocaleString()} in recognizable revenue-related values.`,
        'low',
        'totalRevenue',
        metrics.totalRevenue
      )
    );
  } else if (datasetTypes.includes('revenue')) {
    operationalGaps.push(
      buildItem(
        'Revenue data exists but is hard to use',
        'Financial columns are present, but the cleaned dataset could not confidently produce usable revenue totals. Field naming or formatting is inconsistent.',
        'high',
        'totalRevenue',
        metrics.totalRevenue
      )
    );
  }

  if (metrics.unassignedRecords > 0) {
    operationalGaps.push(
      buildItem(
        'Some records are not assigned to an owner',
        `${metrics.unassignedRecords} records appear unassigned, which can create blind spots in accountability and follow-up ownership.`,
        metrics.unassignedRecords > 10 ? 'high' : 'medium',
        'unassignedRecords',
        metrics.unassignedRecords
      )
    );
    recommendations.push(
      buildItem(
        'Apply assignment rules to unowned records',
        'Use country, branch, or workload-based routing so new records are automatically distributed to the right counsellor or team.',
        'medium',
        'unassignedRecords',
        metrics.unassignedRecords
      )
    );
  }

  if (metrics.monthlyTrendDirection === 'declining') {
    operationalGaps.push(
      buildItem(
        'Monthly intake is trending down',
        'The month-over-month trend shows declining activity. Review source channels, campaign quality, and response discipline.',
        'high',
        'monthlyTrendDirection',
        metrics.monthlyTrendDirection
      )
    );
  } else if (metrics.monthlyTrendDirection === 'growing') {
    opportunities.push(
      buildItem(
        'Momentum is building',
        'Intake volume is trending upward. This is a good moment to tighten stage progression and nurture quality so growth converts into revenue.',
        'medium',
        'monthlyTrendDirection',
        metrics.monthlyTrendDirection
      )
    );
  }

  if ((metrics.topStage?.count || 0) > 0) {
    insights.push(
      buildItem(
        'Largest operational cluster identified',
        `${metrics.topStage.label} currently holds the biggest concentration of records, making it the best place to inspect bottlenecks first.`,
        'medium',
        'topStage',
        metrics.topStage
      )
    );
  }

  if ((metrics.topSource?.count || 0) > 0) {
    opportunities.push(
      buildItem(
        'Best-performing source surfaced',
        `${metrics.topSource.label} is currently the strongest identifiable source in the uploaded dataset.`,
        'low',
        'topSource',
        metrics.topSource
      )
    );
  }

  missingFields.forEach(([field, count]) => {
    if (count > 0) {
      recommendations.push(
        buildItem(
          `Improve ${field} capture`,
          `${count} rows are missing ${field}. This field should be standardized in the intake template for cleaner automation and reporting.`,
          count > 10 ? 'medium' : 'low',
          field,
          count
        )
      );
    }
  });

  const assistantBriefParts = [
    `Analyzed ${metrics.totalRecords || 0} cleaned records across ${
      datasetTypes.length ? datasetTypes.join(', ') : 'general company data'
    }.`,
    conversionRate
      ? `Observed conversion rate: ${asPercent(conversionRate)}.`
      : 'No confident conversion metric could be inferred from this upload.',
    metrics.totalRevenue
      ? `Recognized revenue footprint: ${Math.round(metrics.totalRevenue).toLocaleString()} ${metrics.currency || 'USD'}.`
      : 'No reliable revenue total was detected.',
    completenessRate
      ? `Data completeness: ${asPercent(completenessRate)}.`
      : 'Data completeness could not be measured confidently.',
  ];

  return {
    insights: dedupeByTitle(insights),
    operationalGaps: dedupeByTitle(operationalGaps),
    opportunities: dedupeByTitle(opportunities),
    recommendations: dedupeByTitle(recommendations),
    assistantBrief: assistantBriefParts.join(' '),
  };
};
