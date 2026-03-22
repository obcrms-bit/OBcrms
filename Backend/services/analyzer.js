const Papa = require('papaparse');
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');

const FIELD_ALIASES = {
  leadId: ['lead_id', 'leadid', 'enquiry_id', 'inquiry_id', 'crm_id'],
  studentId: ['student_id', 'studentid', 'enrollment_id', 'enrolment_id'],
  applicationId: ['application_id', 'app_id', 'applicationid'],
  firstName: ['first_name', 'firstname', 'given_name'],
  lastName: ['last_name', 'lastname', 'surname', 'family_name'],
  name: ['name', 'full_name', 'lead_name', 'student_name', 'client_name', 'contact_name'],
  email: ['email', 'email_address', 'mail', 'primary_email'],
  mobile: ['mobile', 'mobile_number', 'phone', 'phone_number', 'contact_number', 'cell'],
  country: ['country', 'preferred_country', 'destination_country', 'target_country'],
  branch: ['branch', 'branch_name', 'campus', 'office', 'branch_code'],
  assignee: ['assignee', 'assigned_to', 'assigned_user', 'counsellor', 'counselor', 'owner'],
  stage: ['stage', 'pipeline_stage', 'lead_stage', 'application_stage'],
  status: ['status', 'lead_status', 'application_status'],
  source: ['source', 'lead_source', 'source_type', 'channel'],
  serviceType: ['service_type', 'service', 'vertical'],
  course: ['course', 'course_name', 'program', 'program_name'],
  courseLevel: ['course_level', 'level', 'program_level'],
  intake: ['intake', 'intake_month', 'admission_intake'],
  revenue: ['revenue', 'amount', 'amount_total', 'fee', 'invoice_amount', 'payment_amount', 'total'],
  paidAmount: ['paid', 'paid_amount', 'received', 'received_amount'],
  dueAmount: ['due', 'due_amount', 'outstanding', 'balance', 'pending_amount'],
  converted: ['converted', 'is_converted', 'won', 'enrolled', 'admitted'],
  score: ['score', 'lead_score', 'quality_score', 'priority_score'],
  createdAt: ['created_at', 'createdon', 'created_date', 'date', 'lead_date', 'submission_date', 'created'],
  updatedAt: ['updated_at', 'modified_at', 'updated_date'],
  followUpDate: ['followup_date', 'follow_up_date', 'next_followup', 'next_follow_up', 'scheduled_date'],
  revenueMonth: ['revenue_month', 'month', 'billing_month'],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^\+?\d[\d\s().-]{6,}$/;
const CURRENCY_HINT_REGEX = /(amount|revenue|fee|payment|paid|due|balance|total|price)/i;
const DATE_HINT_REGEX = /(date|time|dob|joined|created|updated|follow|submitted|paid|month|year|intake)/i;

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .replace(/\uFEFF/g, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const safeTrim = (value) => (typeof value === 'string' ? value.trim() : value);

const stripCurrency = (value) =>
  String(value || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/,(?=\d{3}\b)/g, '');

const isBlank = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

const parseNumeric = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const stripped = stripCurrency(value);
  if (!stripped || stripped === '-' || stripped === '.') {
    return null;
  }

  const normalized =
    stripped.includes(',') && stripped.includes('.')
      ? stripped.replace(/,/g, '')
      : stripped.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['true', 'yes', 'y', '1', 'converted', 'won', 'paid'].includes(normalized)) {
    return true;
  }
  if (['false', 'no', 'n', '0', 'lost', 'unpaid'].includes(normalized)) {
    return false;
  }
  return null;
};

const parseDateValue = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) {
    return new Date(iso).toISOString();
  }

  const dayMonthYear = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    const nextYear = year.length === 2 ? `20${year}` : year;
    const date = new Date(
      `${nextYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

const inferTypeFromExamples = (header, values = []) => {
  const samples = values.filter((item) => !isBlank(item)).slice(0, 8);

  if (!samples.length) {
    return 'string';
  }

  if (samples.every((item) => EMAIL_REGEX.test(String(item).trim()))) {
    return 'email';
  }

  if (samples.every((item) => PHONE_REGEX.test(String(item).trim()))) {
    return 'phone';
  }

  if (DATE_HINT_REGEX.test(header) && samples.some((item) => parseDateValue(item))) {
    return 'date';
  }

  const numberCount = samples.filter((item) => parseNumeric(item) !== null).length;
  if (numberCount >= Math.ceil(samples.length * 0.75)) {
    return CURRENCY_HINT_REGEX.test(header) ? 'currency' : 'number';
  }

  const boolCount = samples.filter((item) => parseBoolean(item) !== null).length;
  if (boolCount >= Math.ceil(samples.length * 0.75)) {
    return 'boolean';
  }

  return 'string';
};

const scoreAliasMatch = (normalizedHeader, mappedField, examples = []) => {
  const aliases = FIELD_ALIASES[mappedField] || [];
  if (aliases.includes(normalizedHeader)) {
    return 1;
  }

  if (aliases.some((alias) => normalizedHeader.includes(alias) || alias.includes(normalizedHeader))) {
    return 0.7;
  }

  const inferredType = inferTypeFromExamples(normalizedHeader, examples);
  if (mappedField === 'email' && inferredType === 'email') {
    return 0.85;
  }
  if (mappedField === 'mobile' && inferredType === 'phone') {
    return 0.85;
  }
  if (
    ['createdAt', 'updatedAt', 'followUpDate', 'revenueMonth'].includes(mappedField) &&
    inferredType === 'date'
  ) {
    return 0.8;
  }
  if (
    ['revenue', 'paidAmount', 'dueAmount', 'score'].includes(mappedField) &&
    ['number', 'currency'].includes(inferredType)
  ) {
    return 0.8;
  }
  if (mappedField === 'converted' && inferredType === 'boolean') {
    return 0.8;
  }

  return 0;
};

const inferFieldMappings = (rows = [], explicitHeaders = []) => {
  const headerSource = explicitHeaders.length
    ? explicitHeaders
    : unique(rows.flatMap((row) => Object.keys(row || {})));

  return headerSource.map((header) => {
    const normalizedField = normalizeHeader(header);
    const examples = rows
      .map((row) => row?.[header])
      .filter((value) => !isBlank(value))
      .slice(0, 5)
      .map((value) => String(value));
    const inferredType = inferTypeFromExamples(normalizedField, examples);

    let bestMatch = null;
    let bestScore = 0;
    Object.keys(FIELD_ALIASES).forEach((mappedField) => {
      const score = scoreAliasMatch(normalizedField, mappedField, examples);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = mappedField;
      }
    });

    return {
      sourceField: header,
      normalizedField,
      mappedField: bestScore >= 0.55 ? bestMatch : '',
      inferredType,
      confidence: Number(bestScore.toFixed(2)),
      examples,
    };
  });
};

const detectDatasetTypes = (mappedFields = []) => {
  const fieldSet = new Set(mappedFields.filter(Boolean));
  const datasetTypes = [];

  if (
    fieldSet.has('leadId') ||
    fieldSet.has('source') ||
    fieldSet.has('stage') ||
    fieldSet.has('converted') ||
    fieldSet.has('score')
  ) {
    datasetTypes.push('leads');
  }

  if (
    fieldSet.has('studentId') ||
    fieldSet.has('course') ||
    fieldSet.has('courseLevel') ||
    fieldSet.has('intake')
  ) {
    datasetTypes.push('students');
  }

  if (fieldSet.has('applicationId') || fieldSet.has('country')) {
    datasetTypes.push('applications');
  }

  if (fieldSet.has('revenue') || fieldSet.has('paidAmount') || fieldSet.has('dueAmount')) {
    datasetTypes.push('revenue');
  }

  return datasetTypes.length ? datasetTypes : ['operations'];
};

const buildRowValue = (mappedField, value) => {
  if (isBlank(value)) {
    return null;
  }

  if (['revenue', 'paidAmount', 'dueAmount', 'score'].includes(mappedField)) {
    return parseNumeric(value);
  }
  if (['createdAt', 'updatedAt', 'followUpDate', 'revenueMonth'].includes(mappedField)) {
    return parseDateValue(value);
  }
  if (mappedField === 'converted') {
    return parseBoolean(value);
  }
  if (mappedField === 'email') {
    return String(value || '').trim().toLowerCase();
  }
  if (mappedField === 'mobile') {
    return String(value || '').replace(/[^\d+]/g, '');
  }

  return safeTrim(value);
};

const inferDerivedFields = (record) => {
  const nextRecord = { ...record };

  if (!nextRecord.name && (nextRecord.firstName || nextRecord.lastName)) {
    nextRecord.name =
      [nextRecord.firstName, nextRecord.lastName].filter(Boolean).join(' ').trim() || null;
  }

  if (!nextRecord.status && nextRecord.stage) {
    nextRecord.status = nextRecord.stage;
  }
  if (!nextRecord.stage && nextRecord.status) {
    nextRecord.stage = nextRecord.status;
  }
  if (nextRecord.converted === null || nextRecord.converted === undefined) {
    const statusSignal = String(nextRecord.status || nextRecord.stage || '').toLowerCase();
    nextRecord.converted = [
      'converted',
      'won',
      'student',
      'client',
      'enrolled',
      'admitted',
    ].some((token) => statusSignal.includes(token));
  }
  if (
    (nextRecord.revenue === null || nextRecord.revenue === undefined) &&
    nextRecord.paidAmount !== null
  ) {
    nextRecord.revenue = nextRecord.paidAmount;
  }

  return nextRecord;
};

const buildDuplicateSignature = (record) => {
  if (record.email) {
    return `email:${record.email}`;
  }
  if (record.mobile) {
    return `mobile:${record.mobile}`;
  }
  if (record.leadId) {
    return `lead:${record.leadId}`;
  }
  if (record.studentId) {
    return `student:${record.studentId}`;
  }
  if (record.applicationId) {
    return `application:${record.applicationId}`;
  }
  if (record.name && record.createdAt) {
    return `namedate:${record.name}:${record.createdAt}`;
  }
  if (record.name && record.course) {
    return `namecourse:${record.name}:${record.course}`;
  }
  return '';
};

const calculateCoverage = (rows, mapping) => {
  const present = rows.filter((row) => !isBlank(row?.[mapping.sourceField])).length;
  const coverage = rows.length ? (present / rows.length) * 100 : 0;
  return Number(coverage.toFixed(1));
};

const buildPreview = (records = [], fieldMappings = []) => {
  const preferredColumns = unique(
    fieldMappings.filter((mapping) => mapping.mappedField).map((mapping) => mapping.mappedField)
  );
  const extraColumns = unique(records.flatMap((record) => Object.keys(record || {}))).filter(
    (key) => !preferredColumns.includes(key)
  );
  const previewColumns = preferredColumns.concat(extraColumns).slice(0, 12);
  const previewRows = records.slice(0, 15).map((record) =>
    previewColumns.reduce((accumulator, column) => {
      accumulator[column] = record?.[column] ?? null;
      return accumulator;
    }, {})
  );

  return { previewColumns, previewRows };
};

const inferMonthlyBuckets = (records, dateField, valueField = null) => {
  const bucketMap = new Map();

  records.forEach((record) => {
    const rawValue = record?.[dateField];
    if (!rawValue) {
      return;
    }

    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const label = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const current = bucketMap.get(label) || 0;
    const increment = valueField ? Number(record?.[valueField] || 0) : 1;
    bucketMap.set(label, current + increment);
  });

  return Array.from(bucketMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-12)
    .map(([label, value]) => ({
      label,
      value: Number(value.toFixed ? value.toFixed(2) : value),
    }));
};

const detectTrendDirection = (series = []) => {
  if (series.length < 2) {
    return 'flat';
  }

  const first = Number(series[0]?.value || 0);
  const last = Number(series[series.length - 1]?.value || 0);
  if (last > first * 1.1) {
    return 'growing';
  }
  if (last < first * 0.9) {
    return 'declining';
  }
  return 'flat';
};

const analyzeRecords = ({ records = [], datasetTypes = [], quality = {} }) => {
  const totalRecords = records.length;
  const convertedCount = records.filter((record) => record.converted === true).length;
  const revenueRecords = records
    .map((record) => Number(record.revenue || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const totalRevenue = revenueRecords.reduce((sum, value) => sum + value, 0);

  const scores = records
    .map((record) => Number(record.score || 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const avgLeadScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : 0;

  const groupCount = (field) => {
    const counts = new Map();
    records.forEach((record) => {
      const label = String(record?.[field] || 'unassigned').trim() || 'unassigned';
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);
  };

  const stageBreakdown = groupCount('stage');
  const sourceBreakdown = groupCount('source');
  const branchBreakdown = groupCount('branch');
  const assigneeBreakdown = groupCount('assignee');
  const leadQualityBreakdown = [
    {
      label: 'Hot',
      count: records.filter((record) => Number(record.score || 0) >= 75).length,
    },
    {
      label: 'Warm',
      count: records.filter(
        (record) => Number(record.score || 0) >= 45 && Number(record.score || 0) < 75
      ).length,
    },
    {
      label: 'Cold',
      count: records.filter(
        (record) => Number(record.score || 0) > 0 && Number(record.score || 0) < 45
      ).length,
    },
  ].filter((item) => item.count > 0);

  const monthlyTrend = inferMonthlyBuckets(records, 'createdAt');
  const revenueTrend = inferMonthlyBuckets(records, 'createdAt', 'revenue');
  const topStage = stageBreakdown[0] || { label: 'Unknown', count: 0 };
  const topSource = sourceBreakdown[0] || { label: 'Unknown', count: 0 };
  const topBranch = branchBreakdown[0] || { label: 'Unassigned', count: 0 };

  return {
    totalRecords,
    datasetTypes,
    leadCount: datasetTypes.includes('leads') ? totalRecords : 0,
    studentCount: datasetTypes.includes('students') ? totalRecords : 0,
    applicationCount: datasetTypes.includes('applications') ? totalRecords : 0,
    conversionRate: totalRecords ? Number(((convertedCount / totalRecords) * 100).toFixed(1)) : 0,
    convertedCount,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    averageRevenue: revenueRecords.length
      ? Number((totalRevenue / revenueRecords.length).toFixed(2))
      : 0,
    avgLeadScore: Number(avgLeadScore.toFixed(1)),
    unassignedRecords: records.filter((record) => !record.assignee).length,
    topStage,
    topSource,
    topBranch,
    stageBreakdown,
    sourceBreakdown,
    branchBreakdown,
    assigneeBreakdown,
    leadQualityBreakdown,
    monthlyTrend,
    revenueTrend,
    monthlyTrendDirection: detectTrendDirection(monthlyTrend),
    revenueTrendDirection: detectTrendDirection(revenueTrend),
    completenessRate: quality.completenessRate || 0,
    duplicateCount: quality.duplicateCount || 0,
    currency: 'USD',
  };
};

const buildCompanyProfile = ({ metrics = {}, datasetTypes = [], quality = {}, sourceType }) => ({
  headline: `Operational intelligence generated from ${metrics.totalRecords || 0} cleaned ${String(
    sourceType || 'dataset'
  ).toUpperCase()} records.`,
  datasetCoverage: datasetTypes,
  strongestSource: metrics.topSource?.label || 'Unknown',
  busiestStage: metrics.topStage?.label || 'Unknown',
  topBranch: metrics.topBranch?.label || 'Unassigned',
  totalRevenue: metrics.totalRevenue || 0,
  conversionRate: metrics.conversionRate || 0,
  dataCompleteness: quality.completenessRate || 0,
});

const normalizeJsonPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }
  if (payload && typeof payload === 'object') {
    return [payload];
  }
  return [];
};

const normalizeSheetRows = (rows = []) =>
  rows.map((row) =>
    Object.entries(row || {}).reduce((accumulator, [key, value]) => {
      accumulator[String(key || '').trim()] = value;
      return accumulator;
    }, {})
  );

const parsePdfRows = (text) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const keyValueRows = lines
    .map((line) => {
      const delimiter = line.includes(':') ? ':' : line.includes('-') ? '-' : null;
      if (!delimiter) {
        return null;
      }
      const [left, ...right] = line.split(delimiter);
      const key = String(left || '').trim();
      const value = right.join(delimiter).trim();
      if (!key || !value) {
        return null;
      }
      return { field: key, value };
    })
    .filter(Boolean);

  if (keyValueRows.length >= 3) {
    return keyValueRows;
  }

  return lines.map((line, index) => ({
    lineNumber: index + 1,
    text: line,
  }));
};

const parseInputFile = async (file) => {
  const extension = String(file.originalname || '')
    .split('.')
    .pop()
    .toLowerCase();

  if (extension === 'csv') {
    const csvText = file.buffer.toString('utf8');
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => String(header || '').trim(),
    });
    return {
      sourceType: 'csv',
      rows: normalizeSheetRows(parsed.data || []),
      rawText: csvText,
    };
  }

  if (['xlsx', 'xls', 'ods'].includes(extension)) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(firstSheet, {
      defval: '',
      raw: false,
    });
    return {
      sourceType: extension === 'ods' ? 'ods' : 'xlsx',
      rows: normalizeSheetRows(rows),
      rawText: '',
    };
  }

  if (extension === 'json') {
    const text = file.buffer.toString('utf8');
    const payload = JSON.parse(text);
    return {
      sourceType: 'json',
      rows: normalizeSheetRows(normalizeJsonPayload(payload)),
      rawText: text,
    };
  }

  if (extension === 'pdf') {
    const parsed = await pdfParse(file.buffer);
    return {
      sourceType: 'pdf',
      rows: parsePdfRows(parsed.text),
      rawText: parsed.text || '',
    };
  }

  throw new Error('Unsupported file type. Allowed: csv, xlsx, ods, json, pdf.');
};

const buildQualitySummary = (
  records = [],
  missingValueCounts = {},
  duplicateCount = 0,
  blankRowCount = 0,
  inferredFields = [],
  issues = []
) => {
  const totalPossibleValues = records.length * Math.max(Object.keys(missingValueCounts).length, 1);
  const totalMissing = Object.values(missingValueCounts).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const completenessRate = totalPossibleValues
    ? Number((((totalPossibleValues - totalMissing) / totalPossibleValues) * 100).toFixed(1))
    : 100;

  return {
    completenessRate,
    duplicateCount,
    blankRowCount,
    inconsistentFieldCount: issues.filter((issue) => issue.code === 'inconsistent_values').length,
    missingValueCounts,
    inferredFields,
    issues,
  };
};

exports.ingestDataset = async (file, options = {}) => {
  const maxRows = Number(options.maxRows || process.env.INTELLIGENCE_MAX_ROWS || 5000);
  const parsed = await parseInputFile(file);

  let rows = Array.isArray(parsed.rows) ? parsed.rows : [];
  const issues = [];

  if (rows.length > maxRows) {
    issues.push({
      level: 'warning',
      code: 'row_limit_applied',
      message: `Only the first ${maxRows} rows were processed for intelligence analysis.`,
      count: rows.length - maxRows,
    });
    rows = rows.slice(0, maxRows);
  }

  const fieldMappings = inferFieldMappings(rows);
  const mappedFields = fieldMappings.map((mapping) => mapping.mappedField);
  const datasetTypes = detectDatasetTypes(mappedFields);
  const inferredFields = fieldMappings
    .filter((mapping) => mapping.mappedField && mapping.confidence < 1)
    .map((mapping) => mapping.mappedField);

  fieldMappings.forEach((mapping) => {
    mapping.coverage = calculateCoverage(rows, mapping);
  });

  const missingValueCounts = {};
  const seenDuplicates = new Set();
  const normalizedRecords = [];
  let blankRowCount = 0;
  let duplicateCount = 0;

  rows.forEach((row) => {
    const normalizedRecord = {};
    let hasAnyValue = false;

    fieldMappings.forEach((mapping) => {
      const sourceValue = row?.[mapping.sourceField];
      if (!isBlank(sourceValue)) {
        hasAnyValue = true;
      }

      const targetKey = mapping.mappedField || mapping.normalizedField;
      normalizedRecord[targetKey] = buildRowValue(mapping.mappedField, sourceValue);

      if (isBlank(normalizedRecord[targetKey])) {
        missingValueCounts[targetKey] = (missingValueCounts[targetKey] || 0) + 1;
      }
    });

    if (!hasAnyValue) {
      blankRowCount += 1;
      return;
    }

    const inferredRecord = inferDerivedFields(normalizedRecord);
    const signature = buildDuplicateSignature(inferredRecord);

    if (signature && seenDuplicates.has(signature)) {
      duplicateCount += 1;
      return;
    }

    if (signature) {
      seenDuplicates.add(signature);
    }

    normalizedRecords.push(inferredRecord);
  });

  fieldMappings.forEach((mapping) => {
    const targetKey = mapping.mappedField || mapping.normalizedField;
    const values = normalizedRecords
      .map((record) => record?.[targetKey])
      .filter((value) => !isBlank(value))
      .slice(0, 5)
      .map((value) => String(value));
    mapping.examples = values;

    const distinctTypes = unique(
      normalizedRecords
        .map((record) => record?.[targetKey])
        .filter((value) => !isBlank(value))
        .slice(0, 20)
        .map((value) => {
          if (typeof value === 'number') {
            return 'number';
          }
          if (typeof value === 'boolean') {
            return 'boolean';
          }
          if (typeof value === 'string' && parseDateValue(value)) {
            return 'date';
          }
          return typeof value;
        })
    );

    if (distinctTypes.length > 2) {
      issues.push({
        level: 'warning',
        code: 'inconsistent_values',
        message: `${targetKey} contains mixed value types and may need template cleanup.`,
        field: targetKey,
        count: distinctTypes.length,
        metadata: {
          types: distinctTypes,
        },
      });
    }
  });

  const quality = buildQualitySummary(
    normalizedRecords,
    missingValueCounts,
    duplicateCount,
    blankRowCount,
    inferredFields,
    issues
  );

  const metrics = analyzeRecords({
    records: normalizedRecords,
    datasetTypes,
    quality,
  });
  const companyProfile = buildCompanyProfile({
    metrics,
    datasetTypes,
    quality,
    sourceType: parsed.sourceType,
  });
  const preview = buildPreview(normalizedRecords, fieldMappings);

  return {
    sourceType: parsed.sourceType,
    rows,
    normalizedRecords,
    datasetTypes,
    fieldMappings,
    previewColumns: preview.previewColumns,
    previewRows: preview.previewRows,
    rawText: parsed.rawText || '',
    quality,
    metrics,
    companyProfile,
  };
};

exports.reanalyzeDatasetRecords = ({
  normalizedRecords = [],
  sourceType = 'json',
  rawText = '',
  explicitHeaders = [],
}) => {
  const fieldMappings = inferFieldMappings(
    normalizedRecords.map((record) => ({ ...record })),
    explicitHeaders
  );
  const datasetTypes = detectDatasetTypes(fieldMappings.map((mapping) => mapping.mappedField));
  const preview = buildPreview(normalizedRecords, fieldMappings);
  const missingValueCounts = {};

  normalizedRecords.forEach((record) => {
    Object.keys(record || {}).forEach((key) => {
      if (isBlank(record[key])) {
        missingValueCounts[key] = (missingValueCounts[key] || 0) + 1;
      }
    });
  });

  const quality = buildQualitySummary(
    normalizedRecords,
    missingValueCounts,
    0,
    0,
    fieldMappings
      .filter((mapping) => mapping.mappedField && mapping.confidence < 1)
      .map((mapping) => mapping.mappedField),
    []
  );
  const metrics = analyzeRecords({
    records: normalizedRecords,
    datasetTypes,
    quality,
  });
  const companyProfile = buildCompanyProfile({
    metrics,
    datasetTypes,
    quality,
    sourceType,
  });

  return {
    sourceType,
    datasetTypes,
    fieldMappings,
    previewColumns: preview.previewColumns,
    previewRows: preview.previewRows,
    rawText,
    quality,
    metrics,
    companyProfile,
  };
};
