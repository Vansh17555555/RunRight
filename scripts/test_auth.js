const http = require('http');

// Helper to make requests
function request(path, method, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data || '{}') });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    const email = `test${Date.now()}@example.com`; // Unique email
    const password = 'password123';

    console.log(`\n\n--- 1. Registering User (${email}) ---`);
    const regRes = await request('/auth/register', 'POST', { email, password });
    console.log('Status:', regRes.statusCode);
    if (regRes.statusCode !== 201) {
        console.error('Registration failed:', regRes.body);
        process.exit(1);
    }
    console.log('User ID:', regRes.body.user.id);
    console.log('Token:', regRes.body.token ? 'Yes' : 'No');

    const token = regRes.body.token;

    console.log('\n\n--- 2. Verifying Protected Route (Without Token) ---');
    const failRes = await request('/submissions', 'POST', {
        language: 'python',
        sourceCode: 'print("Bad Request")'
    });
    console.log('Status:', failRes.statusCode);
    console.log('Error:', failRes.body.error);
    if (failRes.statusCode !== 401) {
        console.error('Failed: Should have been 401');
    }

    console.log('\n\n--- 3. Verifying Protected Route (With Token) ---');
    const successRes = await request('/submissions', 'POST', {
        language: 'python',
        sourceCode: 'print("Authenticated Job")'
    }, { Authorization: `Bearer ${token}` });
    
    console.log('Status:', successRes.statusCode);
    console.log('Submission ID:', successRes.body.submissionId);
    if (successRes.statusCode !== 202) {
        console.error('Failed:', successRes.body);
    }

    console.log('\n\n--- Tests Completed Successfully ---');
}

run().catch(console.error);
