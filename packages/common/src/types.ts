// Types handled by Prisma: Submission, SubmissionStatus, Verdict, ExecutionResult
// from '@prisma/client' via ./db export

export interface JobPayload {
  submissionId: string;
  language: string;
  code: string;
  problemId?: string | null;
}

export const RedisEvents = {
  SUBMISSION_COMPLETED: 'SUBMISSION_COMPLETED'
} as const;

