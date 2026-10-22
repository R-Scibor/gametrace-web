import client from './client';

/** Diagnostic context sent with every user report (same shape as the mobile app). */
export type ReportContext = {
  screen: string;
  platform: string;
  osVersion: string;
  appVersion: string;
};

export async function submitReport(message: string, context: ReportContext): Promise<void> {
  await client.post('/reports', { message, context });
}
