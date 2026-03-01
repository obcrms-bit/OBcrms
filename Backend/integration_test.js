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
    const report = {
        working: [],
        needsFix: [],
        notWorking: [],
        bugs: [],
        uiInconsistencies: [],
        securityRisks: [],
        archWeaknesses: []
    };

    const assert = (condition, successMsg, failMsg, type = 'notWorking') => {
        if (condition) {
            report.working.push(successMsg);
            console.log(`PASS: ${successMsg}`);
            return true;
        } else {
            report[type].push(failMsg);
            console.log(`FAIL: ${failMsg}`);
            return false;
        }
    };

    try {
        // 1. START SYSTEM
        console.log("1. Checking System API...");
        const health = await fetch('http://localhost:5000/');
        assert(health.status === 200, "Backend API is running", "Backend API failed to respond");

        const frontend = await fetch('http://localhost:3000/');
        assert(frontend.status === 200, "Frontend is serving files", "Frontend failed to respond");

        // 2. CREATE COMPANY A
        console.log("2. Creating Company A...");
        let compA, tokenA;
        try {
            const resA = await fetchJson(`${API_URL}/auth/register-company`, {
                method: 'POST',
                body: {
                    companyName: "Company A",
                    email: "adminA@companya.com",
                    password: "Password123!",
                    name: "Admin A",
                    country: "US"
                }
            });
            compA = resA.data.data.company;
            tokenA = resA.data.data.token;
            assert(true, "Company A Created", "");
        } catch (err) {
            if (err.response?.status === 409) {
                const resLogin = await fetchJson(`${API_URL}/auth/login`, {
                    method: 'POST',
                    body: { email: "adminA@companya.com", password: "Password123!" }
                });
                compA = resLogin.data.data.user.companyId;
                tokenA = resLogin.data.data.token;
            } else {
                assert(false, "", "Failed to create Company A: " + (err.response?.data?.message || err.message));
            }
        }

        // CREATE COMPANY B
        console.log("3. Creating Company B...");
        let compB, tokenB;
        try {
            const resB = await fetchJson(`${API_URL}/auth/register-company`, {
                method: 'POST',
                body: {
                    companyName: "Company B",
                    email: "adminB@companyb.com",
                    password: "Password123!",
                    name: "Admin B",
                    country: "UK"
                }
            });
            compB = resB.data.data.company;
            tokenB = resB.data.data.token;
            assert(true, "Company B Created", "");
        } catch (err) {
            if (err.response?.status === 409) {
                const resLogin = await fetchJson(`${API_URL}/auth/login`, {
                    method: 'POST',
                    body: { email: "adminB@companyb.com", password: "Password123!" }
                });
                compB = resLogin.data.data.user.companyId;
                tokenB = resLogin.data.data.token;
            } else {
                assert(false, "", "Failed to create Company B: " + JSON.stringify(err.response?.data || err.message));
            }
        }

        // TEST COMPANY ISOLATION FOR LEADS
        console.log("4. Testing Lead Isolation / Creation...");
        const headersA = { 'Authorization': `Bearer ${tokenA}` };
        const headersB = { 'Authorization': `Bearer ${tokenB}` };

        let leadA;
        try {
            const lRes = await fetchJson(`${API_URL}/leads`, {
                method: 'POST',
                headers: headersA,
                body: {
                    name: "Lead Company A",
                    email: `leada_${Date.now()}@test.com`,
                    phone: "1234567890",
                    source: "website",
                    status: "new"
                }
            });
            leadA = lRes.data.data || lRes.data;
            assert(true, "Company A Lead Created", "");
        } catch (err) {
            assert(false, "", "Company A Lead Creation Failed: " + JSON.stringify(err.response?.data || err.message));
        }

        if (leadA && leadA._id) {
            try {
                const getB = await fetchJson(`${API_URL}/leads/${leadA._id}`, { headers: headersB });
                if (getB.status === 200 && getB.data) {
                    assert(false, "", "MULTI-TENANT LEAK: Company B can access Company A's Lead!");
                    report.securityRisks.push("Company B can access Company A's leads via direct ID fetch");
                    report.archWeaknesses.push("Missing companyId on Lead / Missing role checks in Lead fetching");
                }
            } catch (err) {
                if (err.response?.status === 404 || err.response?.status === 403 || err.response?.status === 401 || err.response?.status === 500) {
                    assert(true, "Tenant Isolation: Company B blocked from A's lead", "");
                } else {
                    console.log("Expected error when B getting A's lead:", err.response?.status);
                }
            }
        }

        // Fetch all leads for B, should not see A's lead
        try {
            const listB = await fetchJson(`${API_URL}/leads`, { headers: headersB });
            const leadsData = listB.data.data || listB.data;

            if (Array.isArray(leadsData)) {
                const foundA = leadsData.some(l => l.email && l.email.includes("leada"));
                if (foundA) {
                    assert(false, "Lead List isolated", "MULTI-TENANT LEAK: Company B listed Company A's Lead!");
                    report.securityRisks.push("Lead listing returns records for all companies");
                } else {
                    assert(true, "Lead List isolation working", "Lead list isolation failed");
                }
            } else {
                console.log("Non-array response for leads list", leadsData);
            }
        } catch (err) {
            console.log("List Leads failed", err.message);
            assert(false, "", "Lead Listing API failed completely");
        }

        // TEST STRUCTURED DATA: BRANCHES, AGENTS, etc.
        try {
            await fetchJson(`${API_URL}/branches`, { method: 'POST', headers: headersA, body: { name: "Branch A" } });
            assert(true, "Branch creation exists", "Branch API throws error");
        } catch (err) {
            assert(false, "Branch Creation", "Branch API /branches does not exist (404)");
            report.bugs.push("Branches module missing endpoints or completely unimplemented");
        }

        try {
            await fetchJson(`${API_URL}/agents`, { method: 'POST', headers: headersA, body: { name: "Agent A" } });
            assert(true, "Agent creation exists", "Agent API throws error");
        } catch (err) {
            assert(false, "Agent Creation", "Agent API /agents does not exist (404)");
            report.bugs.push("Agents module missing endpoints or completely unimplemented");
        }

        try {
            await fetchJson(`${API_URL}/invoices`, { method: 'POST', headers: headersA, body: { amount: 100 } });
            assert(true, "Invoice creation exists", "Invoice API throws error");
        } catch (err) {
            assert(false, "Invoice Creation", "Invoice API /invoices does not exist (404)");
            report.bugs.push("Invoice API missing");
        }

        // STUDENT CREATION
        try {
            const sRes = await fetchJson(`${API_URL}/students`, {
                method: 'POST', headers: headersA, body: {
                    fullName: "Test Student",
                    email: `student_${Date.now()}@a.com`,
                    phone: "111",
                    passportNumber: "P123"
                }
            });
            assert(true, "Student Creation working", "Student creation failed");

            const studentData = sRes.data.data || sRes.data;
            if (studentData && studentData._id) {
                try {
                    await fetchJson(`${API_URL}/students/${studentData._id}`, { headers: headersB });
                    assert(false, "Student Fetch isolated", "MULTI-TENANT LEAK: Company B can access Company A's Student!");
                } catch (err) {
                    if (err.response?.status === 404 || err.response?.status === 403 || err.response?.status === 500) {
                        assert(true, "Student Fetch Isolation working", "Student fetching isolation failed");
                    }
                }
            }
        } catch (err) {
            assert(false, "Student Creation working", "Student creation failed: " + JSON.stringify(err.response?.data || err.message));
        }

        // ROLE BASED ACESS
        console.log("5. Testing Role Based Restrictions...");
        let counselorTokenA;
        try {
            const uRes = await fetchJson(`${API_URL}/auth/register`, {
                method: 'POST', headers: headersA, body: {
                    name: "Counselor 1",
                    email: `counselor_${Date.now()}@companya.com`,
                    password: "Password123!",
                    role: "counselor"
                }
            });
            counselorTokenA = uRes.data.data?.token; // Try if login returns it
            if (!counselorTokenA) {
                const cLogin = await fetchJson(`${API_URL}/auth/login`, {
                    method: 'POST', body: {
                        email: uRes.data.data?.email || uRes.data.email,
                        password: "Password123!"
                    }
                });
                counselorTokenA = cLogin.data.data.token;
            }
            assert(true, "Counselor role created and logged in", "Counselor login failed");
        } catch (err) {
            assert(false, "Counselor role creation & login", "Failed to create/login counselor: " + JSON.stringify(err.response?.data || err.message));
        }

        fs.writeFileSync('final-test-report.json', JSON.stringify(report, null, 2));
        console.log("Report written to final-test-report.json");

    } catch (err) {
        console.error("Test Exception:", err);
    }
};

runTest();
