const http = require('http');

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
    // 1. Authenticate to get token
    const email = `admin_${Date.now()}@example.com`;
    const auth = await request('/auth/register', 'POST', { email, password: 'password' });
    const token = auth.token;
    
    console.log('Admin Token acquired.');

    // 2. Check Stats
    console.log('\nChecking Queue Stats...');
    const stats = await request('/admin/stats', 'GET', null, { 'Authorization': `Bearer ${token}` });
    
    console.log('--- System Status ---');
    console.log(`Queue Depth: ${stats.queueDepth}`);
    console.log(`Status: ${stats.status}`);
    
    if (stats.queueDepth > 10) {
        console.log('⚠️ ALERT: High Load! Consider scaling up workers.');
        console.log('Run: docker compose up -d --scale worker=5');
    } else {
        console.log('✅ System Healthy.');
    }
})();
