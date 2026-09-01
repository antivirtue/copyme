export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'threads' | 'twitter' | 'generic';

export interface TranscriptSegment {
  id: number;
  startSeconds: number;
  endSeconds: number;
  startTime: string; // MM:SS or HH:MM:SS
  endTime: string;   // MM:SS or HH:MM:SS
  originalText: string;
  translatedText: string;
}

export interface TranscribeRequest {
  url: string;
  targetLanguage: string;
}

export interface TranscribeResponse {
  success: boolean;
  platform: PlatformType;
  title: string;
  duration?: string;
  sourceLanguage: string;
  targetLanguage: string;
  segments: TranscriptSegment[];
  fullOriginalText: string;
  fullTranslatedText: string;
  error?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}
