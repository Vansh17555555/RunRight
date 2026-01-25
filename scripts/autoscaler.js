const { exec } = require('child_process');
const http = require('http');

// Configuration
const CONFIG = {
    minWorkers: 1,
    maxWorkers: 5,
    scaleUpThreshold: 10,  // Jobs in queue
    scaleDownThreshold: 0, // Jobs in queue
    checkInterval: 10000,   // 10 seconds
    apiUrl: 'http://localhost:3000'
};

let currentWorkers = 1; // Track locally (in a real system, inspect docker ps)

async function getStats() {
    return new Promise((resolve) => {
        // First authenticate (skip for brevity, assuming token or internal IPC)
        // For this demo, we assume we have a token or the endpoint is internal-only
        // In this script we'll simulate the request logic for the demo
        
        // Use the token flow if needed, but for simplicity here's the structure
        const req = http.get(`${CONFIG.apiUrl}/admin/stats`, {
             // Auth headers here
             headers: { 'Authorization': 'Bearer <YOUR_ADMIN_TOKEN_HERE>' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data || '{}')));
        });
        req.on('error', () => resolve({ queueDepth: 0 }));
    });
}

function scaleWorkers(count) {
    if (count === currentWorkers) return;
    
    console.log(`⚖️ Scaling workers to ${count}...`);
    exec(`docker compose up -d --scale worker=${count} --no-recreate`, (err, stdout) => {
        if (err) {
            console.error('Failed to scale:', err.message);
        } else {
            console.log('✅ Scaled successfully.');
            currentWorkers = count;
        }
    });
}

async function loop() {
    console.log('🔍 Checking Load...');
    const stats = await getStats();
    const queueDiff = stats.queueDepth || 0; // fallback

    console.log(`Queue Depth: ${queueDiff} | Current Workers: ${currentWorkers}`);

    if (queueDiff > CONFIG.scaleUpThreshold && currentWorkers < CONFIG.maxWorkers) {
        // Simple strategy: +1 worker
        scaleWorkers(currentWorkers + 1);
    } 
    else if (queueDiff === CONFIG.scaleDownThreshold && currentWorkers > CONFIG.minWorkers) {
         // Simple strategy: -1 worker
         scaleWorkers(currentWorkers - 1);
    }
    
    setTimeout(loop, CONFIG.checkInterval);
}

// Start
console.log('🤖 Autoscaler Bot Started');
loop();
