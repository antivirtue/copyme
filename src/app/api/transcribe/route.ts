import { NextRequest, NextResponse } from 'next/server';
import { PlatformType, TranscriptSegment, TranscribeResponse } from '../../../types';

function getPlatform(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('threads.net')) return 'threads';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  return 'generic';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, targetLanguage = 'Indonesian' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL video tidak valid.' },
        { status: 400 }
      );
    }

    const platform = getPlatform(url);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API Key belum terpasang di Vercel Environment Variables.',
        },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a video transcription and translation assistant.
Analyze this video URL: ${url} (Platform: ${platform}).
Generate sequential dialogue segments with timestamps and translate them into ${targetLanguage}.
Output strictly valid JSON with no markdown formatting.`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nReturn JSON with schema:
{
  "title": "Video title or brief summary",
  "sourceLanguage": "Detected spoken language",
  "targetLanguage": "${targetLanguage}",
  "segments": [
    {
      "id": 1,
      "startSeconds": 0,
      "endSeconds": 5,
      "startTime": "00:00",
      "endTime": "00:05",
      "originalText": "Transcription here",
      "translatedText": "Translation here"
    }
  ]
}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    };

    // Gunakan model gemini-1.5-flash yang stabil untuk tier gratis
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kuota gratis Gemini API sedang padat/penuh per menit. Tunggu 60 detik lalu klik Transcribe kembali.',
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errDetail = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Google API Error (${response.status}): ${errDetail}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tidak ada respons teks yang dihasilkan dari URL ini.',
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
      title: parsedData.title || 'Video Transcript',
      sourceLanguage: parsedData.sourceLanguage || 'Auto Detected',
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
        error: error.message || 'Terjadi kesalahan internal server.',
      },
      { status: 500 }
    );
  }
}
