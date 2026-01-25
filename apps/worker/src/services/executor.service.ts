import { spawn } from 'child_process';
import { logger } from '../utils/logger';

interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

interface LanguageConfig {
  image: string;
  runCommand: (file: string) => string;
  extension: string;
  memory: string;
  cpu: string;
}

const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  python: {
    image: 'python:3.9-slim',
    runCommand: (file) => `python3 ${file}`,
    extension: 'py',
    memory: '128m',
    cpu: '0.5'
  },
  javascript: {
    image: 'node:18-slim',
    runCommand: (file) => `node ${file}`,
    extension: 'js',
    memory: '256m',
    cpu: '0.8'
  },
  cpp: {
    image: 'gcc:latest', // Heavier, but standard
    runCommand: (file) => `g++ -o /tmp/app ${file} && /tmp/app`,
    extension: 'cpp',
    memory: '256m',
    cpu: '1.0'
  }
};

export class ExecutorService {

  async execute(language: string, code: string, input?: string): Promise<ExecutionOutput> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
      throw new Error(`Language ${language} not supported`);
    }

    const filename = `code.${config.extension}`;
    const base64Code = Buffer.from(code).toString('base64');

    // Docker command:
    // 1. Decode the code from env var and save to file
    // 2. Run the code (it will read from stdin which we will pipe now)
    const internalCommand = `echo $CODE_B64 | base64 -d > /tmp/${filename} && ${config.runCommand(`/tmp/${filename}`)}`;
    
    // Docker arguments
    const args = [
      'run',
      '--rm',
      '-i',
      `--env=CODE_B64=${base64Code}`,
      `--memory=${config.memory}`,
      `--cpus=${config.cpu}`,
      '--network=none',
      '--read-only',
      '--pids-limit=64',
      '--tmpfs=/tmp:exec',
      config.image,
      'sh',
      '-c',
      internalCommand
    ];

    logger.info('Executing Docker', { language, hasInput: !!input });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('docker', args);

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeout = setTimeout(() => {
        isTimedOut = true;
        child.kill(); 
        stderr += '\nExecution timed out (Node.js Controller limit)';
      }, 15000);

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || (isTimedOut ? 124 : 0),
          duration
        });
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        resolve({
          stdout: '',
          stderr: `Spawn error: ${err.message}`,
          exitCode: 1,
          duration
        });
      });

      // Write test case input to stdin
      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();
    });
  }
}
