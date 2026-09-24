/**
 * CampusFlow Automated API Test Suite
 * Validates authentication, roles, CRUD operations, workflow state transitions,
 * event RSVPs, and resource bookings.
 */

const http = require('http');

async function runTests() {
  console.log('🧪 Starting CampusFlow Automated Test Suite...\n');

  // Launch express server in memory
  const app = require('./server/index');
  const server = app.listen(5099);

  const BASE_URL = 'http://localhost:5099/api';

  async function request(endpoint, options = {}) {
    const url = new URL(BASE_URL + endpoint);
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method: options.method || 'GET',
        headers
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('1. Health Check:');
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'healthy', 'API health check returns 200 healthy');

    // 2. Auth - Demo Login
    console.log('\n2. Authentication & JWT:');
    const studentLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'student' }
    });
    assert(studentLogin.status === 200 && studentLogin.data.token, 'Student demo login returns valid JWT');
    const studentToken = studentLogin.data.token;
    const studentUser = studentLogin.data.user;

    const adminLogin = await request('/auth/demo-login', {
      method: 'POST',
      body: { role: 'admin' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'Admin login returns role "admin"');
    const adminToken = adminLogin.data.token;

    // 3. Issues CRUD & Workflow Transitions
    console.log('\n3. Issues CRUD & Workflow State Machine:');
    const createIssueRes = await request('/issues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        title: 'Projector broken in Lab 303',
        description: 'HDMI port is loose and display shuts down after 5 minutes.',
        category: 'academic',
        priority: 'high',
        location: 'CS Building, Lab 303'
      }
    });
    assert(createIssueRes.status === 201 && createIssueRes.data.issue.status === 'submitted', 'Student creates issue -> Status: "submitted"');
    const issueId = createIssueRes.data.issue.id;

    // Workflow Step 1: Assigned
    const assignRes = await request(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'assigned', note: 'Assigned to IT hardware team lead.' }
    });
    assert(assignRes.status === 200 && assignRes.data.issue.status === 'assigned', 'Admin assigns issue -> Status: "assigned"');

    // Workflow Step 2: In Progress
    const inProgressRes = await request(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'in_progress', note: 'Technician on site replacing cable.' }
    });
    assert(inProgressRes.status === 200 && inProgressRes.data.issue.status === 'in_progress', 'Technician starts work -> Status: "in_progress"');

    // Workflow Step 3: Resolved
    const resolvedRes = await request(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'resolved', note: 'HDMI cable and port replacement completed.' }
    });
    assert(resolvedRes.status === 200 && resolvedRes.data.issue.status === 'resolved', 'Issue resolved -> Status: "resolved"');

    // Workflow Step 4: Reopened by student
    const reopenedRes = await request(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { status: 'reopened', note: 'HDMI works but color is yellow tinted.' }
    });
    assert(reopenedRes.status === 200 && reopenedRes.data.issue.status === 'reopened', 'Student reopens issue -> Status: "reopened"');

    // Student authorization restriction: Student cannot set status directly to 'in_progress'
    const unauthStatusRes = await request(`/issues/${issueId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { status: 'in_progress' }
    });
    assert(unauthStatusRes.status === 403, 'Role-based authorization prevents student from unauthorized status transition (403)');

    // 4. Comments & Audit Trail
    console.log('\n4. Issue Comments & Audit Trail:');
    const commentRes = await request(`/issues/${issueId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { content: 'Please also check the audio output jack.' }
    });
    assert(commentRes.status === 201 && commentRes.data.comments.length >= 5, 'Comment added with full audit history preserved');

    // 5. Search, Filter & Pagination
    console.log('\n5. Search, Filtering & Pagination:');
    const filterRes = await request('/issues?q=Projector&category=academic&page=1&limit=5', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(filterRes.status === 200 && filterRes.data.data.length > 0 && filterRes.data.pagination.page === 1, 'Search by keyword and category with pagination');

    // 6. Events & RSVP
    console.log('\n6. Events & RSVP System:');
    const eventsRes = await request('/events', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(eventsRes.status === 200 && Array.isArray(eventsRes.data.data), 'Fetch campus events list');

    const firstEventId = eventsRes.data.data[0].id;
    const rsvpRes = await request(`/events/${firstEventId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(rsvpRes.status === 200 || rsvpRes.status === 400, 'RSVP endpoint responds with success or duplicate check');

    // 7. Facilities & Resources Booking
    console.log('\n7. Resources & Booking Flow:');
    const resourcesRes = await request('/resources', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resourcesRes.status === 200 && resourcesRes.data.data.length > 0, 'List campus facilities & resources');

    const bookingRes = await request(`/resources/${resourcesRes.data.data[0].id}/book`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        start_time: '2026-10-10 10:00',
        end_time: '2026-10-10 12:00',
        purpose: 'AI Model testing'
      }
    });
    assert(bookingRes.status === 201 && bookingRes.data.booking.status === 'pending', 'Student books resource -> Pending approval');

    // 8. Admin Analytics Dashboard
    console.log('\n8. Admin Analytics & Statistics:');
    const analyticsRes = await request('/analytics/summary', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analyticsRes.status === 200 && analyticsRes.data.data.kpis.totalIssues > 0, 'Admin analytics summary returns full KPIs & breakdowns');

    console.log(`\n===========================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`===========================================\n`);

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    server.close();
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
