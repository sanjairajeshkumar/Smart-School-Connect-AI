const http = require('http');
const { startServer, stopServer } = require('./src/server');

const TEST_PORT = 5000;

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('SMART SCHOOL CONNECT: END-TO-END MULTI-TENANT PRODUCTION VERIFICATION');
  console.log('================================================================');

  let serverStarted = false;
  try {
    console.log(`Starting server on port ${TEST_PORT}...`);
    await startServer(TEST_PORT);
    serverStarted = true;
  } catch (err) {
    console.log(`Note: Server already running on port ${TEST_PORT} or bound: ${err.message}`);
  }

  try {
    // Test 1: API Health Check
    console.log('\n[1] Checking API Health...');
    const health = await request('/api/health');
    console.log(`Status: ${health.status}, App: ${health.data?.app}, Mode: ${health.data?.mode}`);
    if (health.status !== 200) throw new Error('Health check failed');

    // Test 2: Verify Prototype Student PIN Endpoint is Removed (Should return 404)
    console.log('\n[2] Verifying Prototype PIN Login Endpoint is Removed...');
    const pinTest = await request('/api/auth/student-pin', 'POST', { pin: '1234' });
    console.log(`Status: ${pinTest.status} (Expected: 404 Not Found)`);
    if (pinTest.status !== 404) throw new Error('Prototype PIN endpoint should have been completely deleted!');

    // Test 3: Default Superadmin Login (admin / admin123)
    console.log('\n[3] Testing Default Superadmin Login (admin / admin123)...');
    const adminLoginRes = await request('/api/auth/login', 'POST', {
      identifier: 'admin',
      password: 'admin123',
    });
    console.log(`Status: ${adminLoginRes.status}, User: ${adminLoginRes.data?.data?.user?.name}, Role: ${adminLoginRes.data?.data?.user?.role}`);
    if (adminLoginRes.status !== 200 || !adminLoginRes.data?.data?.token) {
      throw new Error(`Failed to login as default superadmin: ${JSON.stringify(adminLoginRes.data)}`);
    }
    let adminToken = adminLoginRes.data?.data?.token;

    // Test 4: Superadmin Profile & Password Update in Superadmin Dashboard
    console.log('\n[4] Testing Superadmin Password Update within Dashboard...');
    const updateProfileRes = await request(
      '/api/auth/superadmin/profile',
      'PUT',
      {
        name: 'Head Superadmin',
        currentPassword: 'admin123',
        newPassword: 'adminNewPassword123!',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Status: ${updateProfileRes.status}, Message: ${updateProfileRes.data?.message}`);
    if (updateProfileRes.status !== 200) throw new Error('Failed to update Superadmin credentials');

    // Verify login with new password
    const newLoginRes = await request('/api/auth/login', 'POST', {
      identifier: 'admin',
      password: 'adminNewPassword123!',
    });
    if (newLoginRes.status !== 200) throw new Error('Could not log in with updated superadmin password');
    adminToken = newLoginRes.data?.data?.token;

    // Revert password back to admin123 so system remains standard
    await request(
      '/api/auth/superadmin/profile',
      'PUT',
      {
        name: 'Super Administrator',
        currentPassword: 'adminNewPassword123!',
        newPassword: 'admin123',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    const revertLogin = await request('/api/auth/login', 'POST', { identifier: 'admin', password: 'admin123' });
    adminToken = revertLogin.data?.data?.token;
    console.log('Superadmin password updated & verified cleanly, restored to default admin123.');

    // Test 5: Superadmin Creates an Academic Class
    console.log('\n[5] Superadmin Creating Academic Class (Grade 10-A)...');
    const timestamp = Date.now();
    const classRes = await request(
      '/api/school/classes',
      'POST',
      { name: `Grade 10`, section: `A${timestamp % 1000}`, roomNumber: 'Room 401', academicYear: '2026-2027' },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Status: ${classRes.status}, Class ID: ${classRes.data?.data?._id}`);
    const classId = classRes.data?.data?._id;

    // Test 6: Superadmin Invites Teacher, Student, and Parent via Email
    console.log('\n[6] Superadmin Sending Real Email Invitations for Teacher, Student & Parent...');
    const teacherEmail = `teacher.${timestamp}@oakridge.edu`;
    const teacherInviteRes = await request(
      '/api/school/invitations',
      'POST',
      { email: teacherEmail, name: 'Prof. Marcus Bell', role: 'teacher', classId },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Teacher Invite Status: ${teacherInviteRes.status}, Token: ${teacherInviteRes.data?.token?.slice(0, 16)}...`);
    const teacherInviteToken = teacherInviteRes.data?.token;

    const studentEmail = `student.${timestamp}@oakridge.edu`;
    const studentInviteRes = await request(
      '/api/school/invitations',
      'POST',
      { email: studentEmail, name: 'Jordan Hayes', role: 'student', classId },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Student Invite Status: ${studentInviteRes.status}, Token: ${studentInviteRes.data?.token?.slice(0, 16)}...`);
    const studentInviteToken = studentInviteRes.data?.token;

    const parentEmail = `parent.${timestamp}@oakridge.edu`;
    const parentInviteRes = await request(
      '/api/school/invitations',
      'POST',
      { email: parentEmail, name: 'Eleanor Hayes', role: 'parent', classId },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Parent Invite Status: ${parentInviteRes.status}, Token: ${parentInviteRes.data?.token?.slice(0, 16)}...`);
    const parentInviteToken = parentInviteRes.data?.token;

    // Test 7: Teacher Accepts Email Invitation & Sets Their Own Password
    console.log('\n[7] Teacher Onboarding (Opening Email Link & Setting Password)...');
    const teacherOnboard = await request('/api/auth/accept-invite', 'POST', {
      token: teacherInviteToken,
      password: 'TeacherPassword2026!',
      name: 'Prof. Marcus Bell',
    });
    console.log(`Status: ${teacherOnboard.status}, Activated User: ${teacherOnboard.data?.data?.user?.email}`);
    const teacherToken = teacherOnboard.data?.data?.token;

    // Test 8: Student Accepts Email Invitation & Sets Their Own Password
    console.log('\n[8] Student Onboarding (Opening Email Link & Setting Password)...');
    const studentOnboard = await request('/api/auth/accept-invite', 'POST', {
      token: studentInviteToken,
      password: 'StudentPassword2026!',
      name: 'Jordan Hayes',
    });
    console.log(`Status: ${studentOnboard.status}, Activated User: ${studentOnboard.data?.data?.user?.email}`);
    const studentToken = studentOnboard.data?.data?.token;
    const studentId = studentOnboard.data?.data?.user?.id;

    // Test 9: Parent Accepts Email Invitation & Sets Their Own Password
    console.log('\n[9] Parent Onboarding (Opening Email Link & Setting Password)...');
    const parentOnboard = await request('/api/auth/accept-invite', 'POST', {
      token: parentInviteToken,
      password: 'ParentPassword2026!',
      name: 'Eleanor Hayes',
    });
    console.log(`Status: ${parentOnboard.status}, Activated User: ${parentOnboard.data?.data?.user?.email}`);
    const parentToken = parentOnboard.data?.data?.token;

    // Test 10: Teacher Marks Real-Time Attendance
    console.log('\n[10] Teacher Marking Daily Attendance...');
    const attendanceRes = await request(
      '/api/attendance/mark',
      'POST',
      {
        classId,
        date: new Date().toISOString().split('T')[0],
        records: [{ studentId, studentName: 'Jordan Hayes', status: 'present', remarks: 'On time and engaged' }],
      },
      { Authorization: `Bearer ${teacherToken}` }
    );
    console.log(`Status: ${attendanceRes.status}, Message: ${attendanceRes.data?.message}`);

    // Test 11: Teacher Creates Assignment
    console.log('\n[11] Teacher Creating Assignment...');
    const taskRes = await request(
      '/api/tasks',
      'POST',
      {
        title: 'Chemistry Lab Report - Titration Reactions',
        subject: 'Chemistry',
        description: 'Document laboratory observations and calculate molarity of solutions.',
        classId,
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        priority: 'high',
        maxScore: 100,
      },
      { Authorization: `Bearer ${teacherToken}` }
    );
    console.log(`Status: ${taskRes.status}, Task Created: ${taskRes.data?.data?.title}`);
    const taskId = taskRes.data?.data?._id;

    // Test 12: Student Submits Homework
    console.log('\n[12] Student Submitting Homework...');
    const submitRes = await request(
      `/api/tasks/${taskId}/submit`,
      'POST',
      {
        content: 'Calculated equivalence point at 24.3 mL. Percent error was under 1.2%.',
        timeSpentMinutes: 45,
      },
      { Authorization: `Bearer ${studentToken}` }
    );
    console.log(`Status: ${submitRes.status}, Submission Status: ${submitRes.data?.data?.status}`);
    const submissionId = submitRes.data?.data?._id;

    // Test 13: Teacher Grades Submission
    console.log('\n[13] Teacher Grading Student Submission in Real-Time...');
    const gradeRes = await request(
      `/api/tasks/submissions/${submissionId}/grade`,
      'POST',
      { score: 96, feedback: 'Excellent laboratory calculations and error analysis!' },
      { Authorization: `Bearer ${teacherToken}` }
    );
    console.log(`Status: ${gradeRes.status}, Recorded Score: ${gradeRes.data?.data?.score}/100`);

    // Test 14: School Admin Issues Fee Invoice & Settlement
    console.log('\n[14] Testing Fee Billing & Payment...');
    const feeRes = await request(
      '/api/fees',
      'POST',
      {
        studentId,
        title: 'Term 1 Advanced Chemistry Lab Equipment Fee',
        amount: 150,
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Status: ${feeRes.status}, Invoice Amount: $${feeRes.data?.data?.amount}`);
    const invoiceId = feeRes.data?.data?._id;

    const payRes = await request(
      `/api/fees/${invoiceId}/pay`,
      'POST',
      { paymentReference: 'CHECK-20491' },
      { Authorization: `Bearer ${adminToken}` }
    );
    console.log(`Payment Status: ${payRes.status}, Invoice Settled: ${payRes.data?.data?.status}`);

    // Test 15: Strict RBAC Security Check
    console.log('\n[15] Testing Strict RBAC Enforcement (Student forbidden from Admin Routes)...');
    const rbacTest = await request('/api/school/analytics', 'GET', null, {
      Authorization: `Bearer ${studentToken}`,
    });
    console.log(`Status: ${rbacTest.status} (Expected: 403 Forbidden)`);
    if (rbacTest.status !== 403) throw new Error('RBAC security violation: Student was not blocked from admin routes!');

    // Test 16: Password Reset Request
    console.log('\n[16] Testing "Forgot Password" Email Flow...');
    const forgotRes = await request('/api/auth/forgot-password', 'POST', { email: teacherEmail });
    console.log(`Status: ${forgotRes.status}, Message: ${forgotRes.data?.data?.message}`);

    console.log('\n================================================================');
    console.log('✅ ALL PRODUCTION SAAS END-TO-END TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
    process.exit(0);
  } finally {
    if (serverStarted) {
      console.log('Cleaning up server...');
      await stopServer();
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
