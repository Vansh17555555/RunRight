const io = require('socket.io-client');
const http = require('http');

const API_URL = 'http://localhost:3000';

// Helper for HTTP requests
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
                resolve(JSON.parse(data || '{}'));
            });
        });
        
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

(async () => {
    // 1. Authenticate
    console.log('--- Authenticating ---');
    const email = `ws_test_${Date.now()}@example.com`;
    const authRes = await request('/auth/register', 'POST', { email, password: 'password' });
    const token = authRes.token;

    if (!token) {
        console.error('Failed to get token:', authRes);
        process.exit(1);
    }
    console.log('Authenticated as:', email);

    // 2. Connect via WS
    const socket = io(API_URL);
    console.log('Connecting to WebSocket...');

    socket.on('connect', () => {
        console.log(`Connected: ${socket.id}`);
        submitJob(token, socket);
    });

    socket.on('SUBMISSION_COMPLETED', (result) => {
        console.log('\n--- Real-Time Update Received! ---');
        console.log('Verdict:', result.verdict);
        console.log('Output:', result.stdout || '(no output)');
        socket.disconnect();
    });
})();

async function submitJob(token, socket) {
    console.log('--- Submitting Job ---');
    const body = {
        language: 'python',
        sourceCode: 'print("Hello Secure World via WebSockets!")'
    };

    const res = await request('/submissions', 'POST', body, {
        'Authorization': `Bearer ${token}`
    });

    if (res.submissionId) {
        console.log(`Submission Accepted: ${res.submissionId}`);
        console.log(`Subscribing...`);
        socket.emit('subscribe', res.submissionId);
    } else {
        console.error('Submission Failed:', res);
    }
}
