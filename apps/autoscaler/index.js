const Redis = require('ioredis');
const { exec } = require('child_process');

// Config
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHECK_INTERVAL = 5000; // 5s
const SCALE_COOLDOWN = 30000; // 30s to scale down
const MAX_WORKERS = 5;
const MIN_WORKERS = 1;

// Queues
const QUEUE_FAST = 'submission_queue:fast';
const QUEUE_HEAVY = 'submission_queue:heavy';

const redis = new Redis(REDIS_URL);
let currentWorkers = 1;
let lastScaleTime = Date.now();

// Helper to execute shell commands
const run = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return resolve(false); // Don't crash, just log
        }
        resolve(true);
    });
});

async function getQueueDepth() {
    try {
        const fast = await redis.llen(QUEUE_FAST);
        const heavy = await redis.llen(QUEUE_HEAVY);
        return fast + heavy;
    } catch (e) {
        console.error('Redis Error:', e.message);
        return 0;
    }
}

async function scaleWorkers(count) {
    if (count === currentWorkers) return;
    
    console.log(`⚖️ Scaling workers to ${count}...`);
    // Note: Project name is usually directory name. Assuming 'runright'
    // or we use kompose labels. But 'docker compose scale' works if run in right context.
    // Inside container, we need to target the project.
    // We can use 'docker service scale' if swarm, but here 'docker compose'
    
    // Command: docker compose -p runright up -d --scale worker=N --no-recreate
    // We assume the project name is 'runright' or 'root' based on folder.
    // Let's try flexible approach or defaulting to 'runright'
    
    const cmd = `docker compose -f /app/docker-compose.yml -p runright up -d --scale worker=${count} --no-recreate`;
    
    const success = await run(cmd);
    if (success) {
        console.log(`✅ Scaled to ${count}`);
        currentWorkers = count;
        lastScaleTime = Date.now();
    }
}

async function loop() {
    const depth = await getQueueDepth();
    const now = Date.now();
    
    console.log(`[${new Date().toISOString()}] Queue: ${depth} | Workers: ${currentWorkers}`);

    // Scale Up Logic (Aggressive)
    if (depth > 50 && currentWorkers < MAX_WORKERS) {
        await scaleWorkers(MAX_WORKERS);
    } else if (depth > 20 && currentWorkers < 3) {
        await scaleWorkers(3);
    } else if (depth > 10 && currentWorkers < 2) {
        await scaleWorkers(2);
    } 
    
    // Scale Down Logic (Conservative)
    else if (depth === 0 && currentWorkers > MIN_WORKERS) {
        if (now - lastScaleTime > SCALE_COOLDOWN) {
            console.log('📉 Cooling down...');
            await scaleWorkers(MIN_WORKERS);
        }
    }

    setTimeout(loop, CHECK_INTERVAL);
}

console.log('🤖 Autoscaler Started');
loop();
