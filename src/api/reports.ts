import client from './client';
import type { ReportContext, SubmitReportPayload } from '../types/api';

export async function submitReport(message: string, context: ReportContext): Promise<void> {
  const body: SubmitReportPayload = { message, context };
  await client.post('/reports', body);
}
