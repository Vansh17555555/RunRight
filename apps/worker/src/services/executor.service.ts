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

  /**
   * Starts a new execution session (container) for the given language.
   * Returns the sessionId (container ID).
   */
  async startSession(language: string, code: string): Promise<string> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
      throw new Error(`Language ${language} not supported`);
    }

    const filename = `code.${config.extension}`;
    const base64Code = Buffer.from(code).toString('base64');
    
    // We start a container that sleeps indefinitely, so we can exec commands in it.
    // We also set up the code file immediately upon start.
    const setupCommand = `echo $CODE_B64 | base64 -d > /tmp/${filename} && sleep infinity`;

    const args = [
      'run',
      '-d', // Detached mode
      '--rm', // Remove when stopped
      `--env=CODE_B64=${base64Code}`,
      `--memory=${config.memory}`,
      `--cpus=${config.cpu}`,
      '--network=none',
      '--read-only', // Read-only root fs
      '--pids-limit=64',
      '--tmpfs=/tmp:exec', // Writable /tmp
      config.image,
      'sh',
      '-c',
      setupCommand
    ];

    logger.info('Starting execution session (container)', { language });

    return new Promise((resolve, reject) => {
      const child = spawn('docker', args);
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => stdout += data.toString());
      child.stderr.on('data', (data) => stderr += data.toString());

      child.on('close', (code) => {
        if (code === 0) {
          const containerId = stdout.trim();
          resolve(containerId);
        } else {
          reject(new Error(`Failed to start container: ${stderr}`));
        }
      });
      
      child.on('error', (err) => reject(err));
    });
  }

  /**
   * Executes the code (already in the container) against the given input.
   * Uses `docker exec`.
   */
  async runOnSession(sessionId: string, language: string, input?: string): Promise<ExecutionOutput> {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
       // Should not happen if session started correctly
       throw new Error(`Config missing for ${language}`);
    }

    const filename = `code.${config.extension}`;
    
    // Command to run the code file
    const runCommand = config.runCommand(`/tmp/${filename}`);

    const args = [
      'exec',
      '-i', // Interactive (to pass stdin)
      sessionId,
      'sh',
      '-c',
      runCommand
    ];

    // logger.info('Running execution on session', { sessionId, hasInput: !!input });

    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn('docker', args);

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      // Timeout for individual test case execution
      const timeout = setTimeout(() => {
        isTimedOut = true;
        // We can't easily kill just the exec process without potentially affecting the container,
        // but typically generating a signal or just killing the spawn process is what we do.
        // For `docker exec`, killing the child process (the docker client) usually doesn't stop the internal process immediately
        // unless we use -t (tty) which has other implications.
        // However, for this simple worker, killing the client often suffices to stop listening, 
        // though the process might linger inside until the container is killed.
        
        // A more robust way is `docker exec <container> kill <pid>`, but we don't know the PID easily.
        // For now, valid timeout handling often implies failing the session or just cutting off the read.
        child.kill(); 
        stderr += '\nExecution timed out';
      }, 5000); // 5s timeout per test case

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

      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();
    });
  }

  /**
   * Stops and removes the container.
   */
  async cleanupSession(sessionId: string): Promise<void> {
    logger.info('Cleaning up session', { sessionId });
    // 'docker rm -f' will kill and remove
    const child = spawn('docker', ['rm', '-f', sessionId]);
    
    return new Promise((resolve) => {
        child.on('close', () => resolve());
    });
  }

  // Deprecated single-shot execution, kept for backward compatibility if needed, 
  // or could be removed. Adapting to use new methods for safety.
  async execute(language: string, code: string, input?: string): Promise<ExecutionOutput> {
    let sessionId: string | null = null;
    try {
        sessionId = await this.startSession(language, code);
        return await this.runOnSession(sessionId, language, input);
    } catch (err: any) {
        return {
            stdout: '',
            stderr: err.message,
            exitCode: 1,
            duration: 0
        };
    } finally {
        if (sessionId) await this.cleanupSession(sessionId);
    }
  }
}
