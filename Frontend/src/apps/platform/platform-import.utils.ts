import type { PlatformPlanKey, TenantImportRow, TenantImportSummary } from './platform.types';
import { normalizePlanKey, slugify } from './platform.utils';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createTempPassword = (seed: string) =>
  `Trust!${seed.replace(/[^a-z0-9]/gi, '').slice(0, 6)}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const normalizeBranches = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeBranches(parsed);
    } catch (error) {
      return [];
    }
  }

  return trimmed
    .split(/[|,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseCsvRow = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (isQuoted && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === ',' && !isQuoted) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvText = (text: string): Array<Record<string, any>> => {
  const lines = text
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvRow(lines[0]).map((header) => slugify(header).replace(/-/g, ''));
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || '';
      return row;
    }, {});
  });
};

const mapRawRow = (row: Record<string, any>, index: number): TenantImportRow => {
  const name = String(row.name || row.tenantname || '').trim();
  const domain = String(row.domain || row.code || '').trim();
  const plan = normalizePlanKey(row.plan || row.subscriptionplan);
  const ownerEmail = String(row.ownerEmail || row.owneremail || row.email || '').trim();
  const country = String(row.country || row.region || '').trim();
  const branches = normalizeBranches(row.branches || row.branch || row.offices);

  return {
    id: `tenant-import-row-${index + 1}`,
    name,
    domain,
    plan,
    ownerEmail,
    country,
    branches,
    tempPassword: createTempPassword(domain || name || String(index + 1)),
    status: 'valid',
    errors: {},
    warnings: [],
  };
};

export const parseImportFile = async (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const text = await file.text();

  if (extension === 'json') {
    const parsed = JSON.parse(text);
    const rows: Array<Record<string, any>> = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.tenants)
        ? parsed.tenants
        : [];
    return rows.map((row, index) => mapRawRow(row, index));
  }

  return parseCsvText(text).map((row, index) => mapRawRow(row, index));
};

export const validateImportRows = (
  rows: TenantImportRow[],
  existingDomains: string[] = [],
  existingEmails: string[] = []
) => {
  const domainUsage = new Map<string, number>();
  const emailUsage = new Map<string, number>();

  rows.forEach((row) => {
    const domainKey = row.domain.toLowerCase();
    const emailKey = row.ownerEmail.toLowerCase();

    if (domainKey) {
      domainUsage.set(domainKey, (domainUsage.get(domainKey) || 0) + 1);
    }
    if (emailKey) {
      emailUsage.set(emailKey, (emailUsage.get(emailKey) || 0) + 1);
    }
  });

  const normalizedExistingDomains = new Set(existingDomains.map((value) => value.toLowerCase()));
  const normalizedExistingEmails = new Set(existingEmails.map((value) => value.toLowerCase()));

  return rows.map((row) => {
    const nextRow: TenantImportRow = {
      ...row,
      plan: normalizePlanKey(row.plan),
      warnings: [],
      errors: {},
      runtimeError: '',
    };

    if (!nextRow.name || nextRow.name.length < 3) {
      nextRow.errors.name = 'Tenant name is required.';
    }

    if (!nextRow.domain || nextRow.domain.length < 3) {
      nextRow.errors.domain = 'Domain is required.';
    } else {
      const normalizedDomain = nextRow.domain.toLowerCase();
      if (!/^[a-z0-9-]+$/.test(normalizedDomain)) {
        nextRow.errors.domain = 'Use lowercase letters, numbers, or hyphens only.';
      } else if (domainUsage.get(normalizedDomain)! > 1) {
        nextRow.errors.domain = 'Domain must be unique inside the file.';
      } else if (normalizedExistingDomains.has(normalizedDomain)) {
        nextRow.errors.domain = 'Domain already exists in the platform dataset.';
      }
    }

    if (!nextRow.ownerEmail) {
      nextRow.errors.ownerEmail = 'Owner email is required.';
    } else if (!emailPattern.test(nextRow.ownerEmail)) {
      nextRow.errors.ownerEmail = 'Enter a valid email address.';
    } else {
      const normalizedEmail = nextRow.ownerEmail.toLowerCase();
      if (emailUsage.get(normalizedEmail)! > 1) {
        nextRow.errors.ownerEmail = 'Owner email must be unique inside the file.';
      } else if (normalizedExistingEmails.has(normalizedEmail)) {
        nextRow.errors.ownerEmail = 'Owner email already exists.';
      }
    }

    if (!['starter', 'growth', 'enterprise'].includes(nextRow.plan)) {
      nextRow.errors.plan = 'Plan must be starter, growth, or enterprise.';
    }

    if (!nextRow.country) {
      nextRow.errors.country = 'Country is required.';
    }

    if (!nextRow.branches.length) {
      nextRow.errors.branches = 'At least one branch is required.';
    } else if (nextRow.branches.some((branch) => branch.length < 2)) {
      nextRow.errors.branches = 'Branch names must be at least 2 characters.';
    }

    if (nextRow.branches.length > 8) {
      nextRow.warnings.push('Large branch rollout detected. Review branch ownership before confirm.');
    }

    if (nextRow.plan === 'enterprise' && nextRow.branches.length < 2) {
      nextRow.warnings.push('Enterprise tenants typically launch with multiple branch entities.');
    }

    nextRow.status = Object.keys(nextRow.errors).length
      ? 'error'
      : nextRow.warnings.length
        ? 'warning'
        : 'valid';

    return nextRow;
  });
};

export const summarizeImportRows = (rows: TenantImportRow[]): TenantImportSummary => ({
  totalRows: rows.length,
  validRows: rows.filter((row) => row.status === 'valid').length,
  warningRows: rows.filter((row) => row.status === 'warning').length,
  errorRows: rows.filter((row) => row.status === 'error').length,
  tenantsToCreate: rows.filter((row) => row.status !== 'error').length,
});

export const updateImportRow = (
  rows: TenantImportRow[],
  rowId: string,
  field: keyof TenantImportRow,
  value: string | string[] | PlatformPlanKey
) =>
  rows.map((row) => {
    if (row.id !== rowId) {
      return row;
    }

    if (field === 'branches') {
      return {
        ...row,
        branches: Array.isArray(value) ? value : normalizeBranches(value),
      };
    }

    return {
      ...row,
      [field]: value,
    };
  });

export const downloadImportTemplate = (format: 'csv' | 'json') => {
  const sampleRows = [
    {
      name: 'Trust Education',
      domain: 'trusteducation',
      plan: 'enterprise',
      ownerEmail: 'admin@trust.com',
      country: 'Nepal',
      branches: ['Kathmandu', 'Pokhara'],
    },
    {
      name: 'Atlas Admissions',
      domain: 'atlasadmissions',
      plan: 'growth',
      ownerEmail: 'owner@atlasadmissions.com',
      country: 'United Arab Emirates',
      branches: ['Dubai', 'Abu Dhabi'],
    },
  ];

  const fileContent =
    format === 'json'
      ? JSON.stringify(sampleRows, null, 2)
      : [
          'name,domain,plan,ownerEmail,country,branches',
          ...sampleRows.map((row) =>
            [
              row.name,
              row.domain,
              row.plan,
              row.ownerEmail,
              row.country,
              row.branches.join('|'),
            ]
              .map((value) => `"${String(value).replace(/"/g, '""')}"`)
              .join(',')
          ),
        ].join('\n');

  const blob = new Blob([fileContent], {
    type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `tenant-import-template.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const downloadImportReport = (rows: TenantImportRow[]) => {
  const report = rows.map((row) => ({
    name: row.name,
    domain: row.domain,
    plan: row.plan,
    ownerEmail: row.ownerEmail,
    country: row.country,
    branches: row.branches,
    status: row.status,
    errors: row.errors,
    warnings: row.warnings,
    runtimeError: row.runtimeError || null,
    createdTenantId: row.createdTenantId || null,
  }));

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tenant-import-report.json';
  anchor.click();
  URL.revokeObjectURL(url);
};
