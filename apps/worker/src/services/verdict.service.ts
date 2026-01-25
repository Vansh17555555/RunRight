import { Verdict } from '@runright/common';

interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export class VerdictService {
  determineVerdict(output: ExecutionOutput, timeLimit: number = 5000): Verdict {
    if (output.duration > timeLimit) {
      return Verdict.TLE;
    }

    if (output.exitCode !== 0) {
      // Differentiate between compilation error and runtime error if possible
      // For now, assuming interpreted languages or pre-compiled, mostly RTE
      // If we had a compile step, we'd check that first.
      return Verdict.RTE;
    }

    // In a real judge, we would compare stdout with expected output here.
    // For this MVP without test cases, if it runs successfully, it's AC.
    return Verdict.AC;
  }
}

export const verdictService = new VerdictService();
