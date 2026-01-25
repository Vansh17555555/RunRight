const http = require('http');

const data = JSON.stringify({
  language: 'python',
  sourceCode: 'print("Hello from RunRight!")'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/submissions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let chunks = [];
  
  console.log(`Status: ${res.statusCode}`);
  
  res.on('data', (d) => {
    chunks.push(d);
  });
  
  res.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    console.log('Response:', body);
    
    try {
        const responseJson = JSON.parse(body);
        if (responseJson.submissionId) {
            console.log(`\nChecking status for ${responseJson.submissionId}...`);
            checkStatus(responseJson.submissionId);
        }
    } catch (e) {}
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();

function checkStatus(id) {
    const statusOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/submissions/${id}`,
        method: 'GET'
    };

    console.log('Polling for result...');
    
    const interval = setInterval(() => {
        const req = http.get(statusOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const submission = JSON.parse(data);
                    process.stdout.write(`\rCurrent Status: ${submission.status}`);
                    
                    if (submission.status === 'COMPLETED' || submission.status === 'FAILED') {
                        clearInterval(interval);
                        console.log('\n\n--- Execution Result ---');
                        console.log('Verdict:', submission.result?.verdict);
                        console.log('Output:', submission.result?.stdout || '(no output)');
                        console.log('Errors:', submission.result?.stderr || '(no errors)');
                    }
                } catch (e) {
                    // Ignore JSON parse errors during polling
                }
            });
        });
        
        req.on('error', (e) => {
            console.error(`\nPolling error: ${e.message}`);
            clearInterval(interval);
        });
        
    }, 2000); // Poll every 2 seconds
}
