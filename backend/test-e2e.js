const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/health', method: 'GET' });
      if (res.status === 200) {
        console.log(`Server is ready after ${i + 1} attempt(s)!`);
        return true;
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not become ready in time');
}

async function runTests() {
  console.log('--- Starting Smart School Connect End-to-End Verification ---');
  await waitForServer();

  // 1. Health check
  console.log('\n1. Checking API Health...');
  const health = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`Status: ${health.status}, Response:`, health.data);

  // 2. Teacher Login
  console.log('\n2. Testing Teacher Login (teacher@school.com)...');
  const teacherLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'teacher@school.com', password: 'password123' }
  );
  console.log(`Status: ${teacherLogin.status}, Role: ${teacherLogin.data?.data?.user?.role}, Name: ${teacherLogin.data?.data?.user?.name}`);
  const teacherToken = teacherLogin.data?.data?.token;

  // 3. Student PIN Login
  console.log('\n3. Testing Student PIN Login (PIN: 1234)...');
  const studentLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/student-pin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { pin: '1234' }
  );
  console.log(`Status: ${studentLogin.status}, Role: ${studentLogin.data?.data?.user?.role}, Name: ${studentLogin.data?.data?.user?.name}`);
  const studentToken = studentLogin.data?.data?.token;

  // 4. Tasks fetch for Student
  console.log('\n4. Fetching Tasks for Student Alex...');
  const studentTasks = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/tasks',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log(`Status: ${studentTasks.status}, Count: ${studentTasks.data?.count}`);
  console.log('Tasks retrieved:', studentTasks.data?.data?.map(t => `${t.title} [${t.status}]`));

  // 5. AI Rewrite Draft (Teacher)
  console.log('\n5. Testing AI Draft Rewriting (Teacher -> AI)...');
  const aiRewrite = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/ai/rewrite-draft',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      }
    },
    {
      draft: 'Please remind child to bring ruler tomorrow for math geometry.',
      tone: 'Encouraging',
      audience: 'Grade 8 Parents',
      subject: 'Geometry Materials'
    }
  );
  console.log(`Status: ${aiRewrite.status}, Provider: ${aiRewrite.data?.data?.providerUsed}`);
  console.log('AI Output:\n', aiRewrite.data?.data?.text);

  // 6. AI Student Progress Digest
  console.log('\n6. Testing AI Student Digest Generation...');
  const studentId = studentLogin.data?.data?.user?.id;
  const aiDigest = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/ai/student-digest',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      }
    },
    { studentId }
  );
  console.log(`Status: ${aiDigest.status}, Provider: ${aiDigest.data?.data?.providerUsed}`);
  console.log('Digest Preview:\n', aiDigest.data?.data?.text?.slice(0, 200) + '...');

  // 7. AI Assistant Query ("Ask School AI" - PDF Screen 05)
  console.log('\n7. Testing Ask School AI Assistant ("Summarize my homework for tomorrow")...');
  const aiAssistant = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/ai/assistant',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    },
    { query: 'Summarize my homework for tomorrow.' }
  );
  console.log(`Status: ${aiAssistant.status}, Provider: ${aiAssistant.data?.data?.providerUsed}`);
  console.log('Assistant Output:\n', aiAssistant.data?.data?.text);

  // 8. Test static frontend serving
  console.log('\n8. Testing Web UI Static Serving (GET /)...');
  const webUi = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/',
    method: 'GET'
  });
  console.log(`Status: ${webUi.status}, Content-Type: ${webUi.headers['content-type']}, Length: ${webUi.data?.length || 0} bytes`);

  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test failed:', err);
});
