import { prisma, Verdict } from '@runright/common';
import { ExecutorService } from './executor.service';
import { verdictService } from './verdict.service';
import { logger } from '../utils/logger';

export interface EvaluationResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  passedTests: number;
  totalTests: number;
  cpuTime: number;
}

export class JudgingService {
  private executor: ExecutorService;

  constructor() {
    this.executor = new ExecutorService();
  }

  async judge(submissionId: string, problemId: string, language: string, code: string): Promise<EvaluationResult> {
    logger.info('Starting Judging Flow', { problemId, submissionId });

    const testCases = await prisma.testCase.findMany({
      where: { problemId }
    });

    // Fallback if no test cases (though usually there should be)
    // We can just run it once to check for syntax errors or basic execution.
    if (testCases.length === 0) {
      const output = await this.executor.execute(language, code);
      return {
        verdict: verdictService.determineVerdict(output),
        stdout: output.stdout,
        stderr: output.stderr,
        passedTests: 0,
        totalTests: 0,
        cpuTime: output.duration
      };
    }

    let passedTests = 0;
    let totalCpuTime = 0;
    
    // Start session
    let sessionId: string | null = null;
    
    try {
      sessionId = await this.executor.startSession(language, code);

      for (const testCase of testCases) {
        // Run specific test case on the open session
        const output = await this.executor.runOnSession(sessionId, language, testCase.input);
        
        totalCpuTime += output.duration;

        const verdict = verdictService.determineVerdict(output);
        
        if (verdict !== 'AC') {
          return {
            verdict,
            stdout: output.stdout,
            stderr: output.stderr,
            passedTests,
            totalTests: testCases.length,
            cpuTime: totalCpuTime
          };
        }

        // Comparison logic
        // Normalize by removing all whitespace to handle formatting differences
        // e.g. "[0, 1]" should match "[0,1]"
        const normalize = (str: string) => str.replace(/\s+/g, '');
        
        const normalizedActual = normalize(output.stdout);
        const normalizedExpected = normalize(testCase.expectedOutput);

        if (normalizedActual === normalizedExpected) {
          passedTests++;
        } else {
          return {
            verdict: 'WA' as Verdict,
            stdout: output.stdout,
            stderr: `Expected: ${testCase.expectedOutput}\nActual: ${output.stdout}`,
            passedTests,
            totalTests: testCases.length,
            cpuTime: totalCpuTime
          };
        }
      }
      
      return {
        verdict: 'AC',
        stdout: 'All tests passed!',
        stderr: '',
        passedTests,
        totalTests: testCases.length,
        cpuTime: Math.floor(totalCpuTime / testCases.length)
      };

    } catch (error: any) {
      logger.error('Error during judging session', { submissionId, error: error.message });
      return {
        verdict: 'RTE', // Runtime Error or System Error
        stdout: '',
        stderr: error.message || 'Unknown error occurred',
        passedTests,
        totalTests: testCases.length,
        cpuTime: totalCpuTime
      };
    } finally {
      if (sessionId) {
        await this.executor.cleanupSession(sessionId);
      }
    }
  }
}

export const judgingService = new JudgingService();
