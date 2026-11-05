export type FaqCalloutType = 'tip' | 'gotcha' | 'warning' | 'info';

export interface FaqCalloutData {
  type: FaqCalloutType;
  title?: string;
  text: string;
}

export interface FaqQuestionData {
  id: string; // URL hash slug, e.g. "pc-auto-detect"
  question: string;
  badge?: string; // e.g. "BOT", "AUTH", "CONFLICT", "APK", "DIAG"
  answer: string[]; // Paragraphs
  steps?: string[]; // Optional step-by-step instructions
  callout?: FaqCalloutData;
  keywords?: string[]; // Supplementary search keywords
}

export interface FaqSectionData {
  id: string; // e.g. "getting-started", "discord-pc", "voice-consoles", "library", "analytics", "sessions-conflicts", "mobile-apk", "troubleshooting", "privacy"
  title: string;
  description?: string;
  questions: FaqQuestionData[];
}
