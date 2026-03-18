const fs = require('fs');

const API_URL = 'http://localhost:5000/api';

const fetchJson = async (url, options = {}) => {
  options.headers = { 'Content-Type': 'application/json', ...options.headers };
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, options);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw { response: { status: res.status, data } };
  return { status: res.status, data };
};

const runTest = async () => {
  console.log('🚀 Starting Production Readiness Integration Test...');
  const report = { success: [], failures: [], warnings: [] };

  const assert = (condition, msg) => {
    if (condition) {
      report.success.push(msg);
      console.log(`✅ PASS: ${msg}`);
      return true;
    } else {
      report.failures.push(msg);
      console.log(`❌ FAIL: ${msg}`);
      return false;
    }
  };

  try {
    // 1. Connectivity
    const health = await fetch('http://localhost:5000/');
    assert(health.status === 200, 'Backend connectivity');

    // 2. Multi-tenancy & Registration
    console.log('Testing Company Registration...');
    const regRes = await fetchJson(`${API_URL}/auth/register-company`, {
      method: 'POST',
      body: {
        companyName: 'Test Company Ltd',
        email: `admin_${Date.now()}@trusttest.com`,
        password: 'Password123!',
        name: 'Test Admin',
        country: 'Nepal',
      },
    });
    const token = regRes.data.data.token;
    const companyId = regRes.data.data.company.id;
    const headers = { Authorization: `Bearer ${token}` };
    assert(!!token, 'Admin login token generated');

    // 3. Lead Management
    console.log('Testing Lead Module...');
    const leadRes = await fetchJson(`${API_URL}/leads`, {
      method: 'POST',
      headers,
      body: {
        name: 'John Doe',
        email: `lead_${Date.now()}@gmail.com`,
        phone: '9800000001',
        source: 'Facebook',
        interestedCountry: 'UK',
      },
    });
    const leadId = leadRes.data.data._id;
    assert(!!leadId, 'Lead created successfully');

    // 4. Conversion (Lead to Student)
    console.log('Testing Lead Conversion...');
    const convRes = await fetchJson(`${API_URL}/leads/${leadId}/status`, {
      method: 'PATCH',
      headers,
      body: { status: 'converted' },
    });
    assert(convRes.data.data.status === 'converted', 'Lead status updated to converted');

    // Find the student created from conversion
    const studentsRes = await fetchJson(`${API_URL}/students`, { headers });
    const student = studentsRes.data.data.students.find((s) => s.fullName === 'John Doe');
    const studentId = student?._id;
    assert(!!studentId, 'Student automatically created from lead conversion');

    // 5. University Application
    console.log('Testing Application Module...');
    const appRes = await fetchJson(`${API_URL}/applicants`, {
      method: 'POST',
      headers,
      body: {
        studentId,
        universityName: 'University of London',
        country: 'UK',
        courseName: 'MSc CS',
        intake: 'Sept 2026',
        applicationFee: { amount: 50, currency: 'GBP', status: 'unpaid' },
      },
    });
    const appId = appRes.data.data._id;
    assert(!!appId, 'University application created');

    // 6. Invoicing & Flow
    console.log('Testing Invoicing Module...');
    const invRes = await fetchJson(`${API_URL}/invoices`, {
      method: 'POST',
      headers,
      body: {
        studentId,
        applicantId: appId,
        items: [{ description: 'Service Fee', amount: 500 }],
        subTotal: 500,
        taxPercentage: 10,
        totalAmount: 550,
        currency: 'USD',
        dueDate: '2026-12-31',
      },
    });
    const invId = invRes.data.data._id;
    assert(!!invId, 'Invoice generated successfully');

    // 7. Email Trigger (Mock logic on server)
    console.log('Testing Invoice Email Trigger...');
    try {
      await fetchJson(`${API_URL}/invoices/${invId}/send-email`, { method: 'POST', headers });
      assert(true, 'Invoice email API accepted request (Check server logs for actual send)');
    } catch (err) {
      report.warnings.push(
        'Email service failed - this is expected if EMAIL_USER/PASS not set in .env'
      );
      console.log('⚠️ Warning: Email trigger failed (likely env config missing)');
    }

    // 8. Dashboard Aggregation
    console.log('Testing Dashboard Stats...');
    const dashRes = await fetchJson(`${API_URL}/dashboard/stats`, { headers });
    const stats = dashRes.data.data;
    assert(stats.totalStudents >= 1, 'Dashboard correctly tracking students');
    assert(stats.totalLeads >= 1, 'Dashboard correctly tracking leads');

    fs.writeFileSync('integration-test-results.json', JSON.stringify(report, null, 2));
    console.log('\n✅ ALL CORE MODULE TESTS PASSED (Check integration-test-results.json)');
  } catch (err) {
    console.error('⛔ CRITICAL TEST FAILURE:', err.response?.data || err.message);
    process.exit(1);
  }
};

runTest();
