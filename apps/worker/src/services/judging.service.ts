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

    if (testCases.length === 0) {
      // Fallback to simple execution if no test cases exist
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
    let finalVerdict: Verdict = 'AC';
    let totalCpuTime = 0;
    let firstErrorStdout = '';
    let firstErrorStderr = '';

    for (const testCase of testCases) {
      // For now, we pass input via stdin (ExecutorService handles this)
      // but we need the user code to READ from stdin.
      const output = await this.executor.execute(language, code, testCase.input);
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

      // Comparison logic (trimming for robustness)
      const normalizedActual = output.stdout.trim().replace(/\r\n/g, '\n');
      const normalizedExpected = testCase.expectedOutput.trim().replace(/\r\n/g, '\n');

      if (normalizedActual === normalizedExpected) {
        passedTests++;
      } else {
        return {
          verdict: 'WA',
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
      cpuTime: Math.floor(totalCpuTime / testCases.length) // Average time
    };
  }
}

export const judgingService = new JudgingService();
