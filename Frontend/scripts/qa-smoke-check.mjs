import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const fixturePath = path.join(cwd, 'src', 'data', 'qa-scenarios.json');

const readFixtures = async () => {
  const raw = await fs.readFile(fixturePath, 'utf8');
  return JSON.parse(raw);
};

const getEnv = (key, fallback = '') => process.env[key] || fallback;

const apiBaseUrl = getEnv('QA_API_URL', getEnv('NEXT_PUBLIC_API_URL', '')).replace(/\/$/, '');
const email = getEnv('QA_EMAIL', '');
const password = getEnv('QA_PASSWORD', '');
const timeoutMs = Number(getEnv('QA_TIMEOUT_MS', '30000'));
const allowMutation = getEnv('QA_ENABLE_MUTATION', 'false') === 'true';

if (!apiBaseUrl) {
  console.error('Missing QA_API_URL or NEXT_PUBLIC_API_URL');
  process.exit(1);
}

if (!email || !password) {
  console.error('Missing QA_EMAIL or QA_PASSWORD');
  process.exit(1);
}

const controllerWithTimeout = () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timeout) };
};

const request = async (url, options = {}) => {
  const { controller, clear } = controllerWithTimeout();

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(
        `${options.method || 'GET'} ${url} failed with ${response.status}: ${
          body?.message || response.statusText
        }`
      );
    }

    return body;
  } finally {
    clear();
  }
};

const logPass = (label, detail = '') => {
  console.log(`PASS ${label}${detail ? ` - ${detail}` : ''}`);
};

const authLogin = async () => {
  const result = await request(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = result?.data?.token;
  if (!token) {
    throw new Error('Login succeeded but no token was returned');
  }

  return token;
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const assertCollection = (value, label) => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} did not return an array`);
  }
  logPass(label, `${value.length} records`);
};

const run = async () => {
  const fixtures = await readFixtures();
  logPass('Loaded QA fixtures', `${fixtures.leadScenarios.length} lead scenarios`);

  const token = await authLogin();
  logPass('Authenticated', email);

  const me = await request(`${apiBaseUrl}/auth/me`, {
    headers: authHeaders(token),
  });
  const user = me?.data?.user || me?.data;
  if (!user?._id && !user?.id) {
    throw new Error('Auth/me did not return a valid user record');
  }
  logPass('Loaded profile', `${user.email} (${user.role || user.primaryRoleKey || 'unknown'})`);

  const workflows = await request(`${apiBaseUrl}/leads/workflows`, {
    headers: authHeaders(token),
  });
  assertCollection(workflows?.data?.workflows || [], 'Country workflows');

  const leads = await request(`${apiBaseUrl}/leads?limit=5`, {
    headers: authHeaders(token),
  });
  assertCollection(leads?.data?.leads || [], 'Leads list');

  const followUpSummary = await request(`${apiBaseUrl}/leads/followups/summary`, {
    headers: authHeaders(token),
  });
  if (!followUpSummary?.data?.counts) {
    throw new Error('Follow-up summary did not return counts');
  }
  logPass('Follow-up summary', JSON.stringify(followUpSummary.data.counts));

  const applications = await request(`${apiBaseUrl}/applicants`, {
    headers: authHeaders(token),
  });
  assertCollection(applications?.data?.data || applications?.data || [], 'Applications list');

  const notifications = await request(`${apiBaseUrl}/notifications?limit=5`, {
    headers: authHeaders(token),
  });
  assertCollection(notifications?.data?.notifications || [], 'Notifications');

  const roleKey = String(user.role || user.primaryRoleKey || '').toLowerCase();
  if (['super_admin', 'admin', 'head_office_admin'].includes(roleKey)) {
    const overview = await request(`${apiBaseUrl}/super-admin/overview`, {
      headers: authHeaders(token),
    });
    if (!overview?.data?.kpis) {
      throw new Error('Super admin overview did not return KPI payload');
    }
    logPass('Super admin overview', `${overview.data.kpis.totalTenants || 0} tenants`);
  }

  if (allowMutation) {
    const scenario = fixtures.leadScenarios[0];
    const createLead = await request(`${apiBaseUrl}/leads`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        ...scenario,
        campaign: 'QA Smoke Check',
        qualifications: [],
      }),
    });

    const createdLeadId = createLead?.data?.lead?._id;
    if (!createdLeadId) {
      throw new Error('Lead mutation test did not return a lead id');
    }
    logPass('Mutable lead creation check', createdLeadId);
  } else {
    console.log('INFO Mutation checks skipped. Set QA_ENABLE_MUTATION=true to create a test lead.');
  }

  console.log('Smoke check completed successfully.');
};

run().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
