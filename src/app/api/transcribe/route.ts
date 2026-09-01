import { NextRequest, NextResponse } from 'next/server';
import { PlatformType, TranscriptSegment, TranscribeResponse } from '../../../types';

// Helper to determine platform from URL
function getPlatform(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('threads.net')) return 'threads';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  return 'generic';
}

// Exponential backoff fetcher for Gemini API calls
async function callGeminiWithRetry(url: string, payload: any, maxRetries = 4) {
  const delays = [1000, 2000, 4000, 8000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      }

      if (response.status === 429 && attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, delays[attempt]));
        continue;
      }

      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, delays[attempt]));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, targetLanguage = 'Indonesian' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid video URL is required.' },
        { status: 400 }
      );
    }

    const platform = getPlatform(url);
    const apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: GEMINI_API_KEY environment variable is not set.',
        },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a high-precision speech-to-text transcriber and professional multi-language translator.
Your task is to analyze the provided video link (${url}) across social platforms (${platform}).
Extract all spoken dialogue, vocal segments, or spoken content from the video, generate exact sequential timestamps, and translate the dialogue into ${targetLanguage}.

Rules:
1. Accurately transcribe spoken dialogue in its original language.
2. Segment speech cleanly into concise, natural conversational chunks (typically 3 to 10 seconds per chunk).
3. Provide accurate timestamps (startSeconds, endSeconds, startTime as "MM:SS", endTime as "MM:SS").
4. Translate each segment accurately and naturally into ${targetLanguage}, preserving idioms and tone.
5. Return ONLY a valid JSON object matching the requested schema. No markdown wrapping.`;

    const userQuery = `Process this video URL: ${url}
Target translation language: ${targetLanguage}
Return JSON with fields:
- "title": Title or description of the video
- "sourceLanguage": Primary language spoken in the video
- "targetLanguage": "${targetLanguage}"
- "segments": Array of objects [{ "id": 1, "startSeconds": 0, "endSeconds": 4, "startTime": "00:00", "endTime": "00:04", "originalText": "...", "translatedText": "..." }]`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userQuery}` }],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            sourceLanguage: { type: 'STRING' },
            targetLanguage: { type: 'STRING' },
            segments: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  startSeconds: { type: 'NUMBER' },
                  endSeconds: { type: 'NUMBER' },
                  startTime: { type: 'STRING' },
                  endTime: { type: 'STRING' },
                  originalText: { type: 'STRING' },
                  translatedText: { type: 'STRING' },
                },
                required: ['id', 'startSeconds', 'endSeconds', 'startTime', 'endTime', 'originalText', 'translatedText'],
              },
            },
          },
          required: ['title', 'sourceLanguage', 'targetLanguage', 'segments'],
        },
      },
    };

    const data = await callGeminiWithRetry(geminiEndpoint, payload);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          error: 'No transcription output returned from AI model for this video.',
        },
        { status: 502 }
      );
    }

    const parsedData = JSON.parse(rawText);

    const fullOriginal = (parsedData.segments || [])
      .map((s: TranscriptSegment) => s.originalText)
      .join(' ');
      
    const fullTranslated = (parsedData.segments || [])
      .map((s: TranscriptSegment) => s.translatedText)
      .join(' ');

    const responsePayload: TranscribeResponse = {
      success: true,
      platform,
      title: parsedData.title || 'Extracted Video Content',
      sourceLanguage: parsedData.sourceLanguage || 'Detected Audio',
      targetLanguage: parsedData.targetLanguage || targetLanguage,
      segments: parsedData.segments || [],
      fullOriginalText: fullOriginal,
      fullTranslatedText: fullTranslated,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An internal error occurred while transcribing the video.',
      },
      { status: 500 }
    );
  }
}
