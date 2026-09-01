'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Clock,
  Globe2,
  Youtube,
  Share2,
  Search,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  FileText,
  Subtitles,
  Loader2,
  ArrowRight,
  ClipboardPaste
} from 'lucide-react';
import { PlatformType, TranscribeResponse, SupportedLanguage } from '@/types';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'Indonesian', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'English', name: 'English', nativeName: 'English' },
  { code: 'Spanish', name: 'Spanish', nativeName: 'Español' },
  { code: 'Japanese', name: 'Japanese', nativeName: '日本語' },
  { code: 'Korean', name: 'Korean', nativeName: '한국어' },
  { code: 'Mandarin Chinese', name: 'Mandarin', nativeName: '中文' },
  { code: 'Arabic', name: 'Arabic', nativeName: 'العربية' },
  { code: 'French', name: 'French', nativeName: 'Français' },
  { code: 'German', name: 'German', nativeName: 'Deutsch' },
  { code: 'Russian', name: 'Russian', nativeName: 'Русский' },
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [targetLang, setTargetLang] = useState('Indonesian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'both' | 'original' | 'translated'>('both');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const detectedPlatform = useMemo<PlatformType>(() => {
    const trimmed = url.trim().toLowerCase();
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return 'youtube';
    if (trimmed.includes('tiktok.com')) return 'tiktok';
    if (trimmed.includes('instagram.com')) return 'instagram';
    if (trimmed.includes('threads.net')) return 'threads';
    if (trimmed.includes('twitter.com') || trimmed.includes('x.com')) return 'twitter';
    return 'generic';
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // Fallback if permission blocked
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), targetLanguage: targetLang }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process the video link. Please verify the URL.');
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSegments = useMemo(() => {
    if (!result?.segments) return [];
    if (!searchFilter.trim()) return result.segments;
    const q = searchFilter.toLowerCase();
    return result.segments.filter(
      (s) =>
        s.originalText.toLowerCase().includes(q) ||
        s.translatedText.toLowerCase().includes(q)
    );
  }, [result, searchFilter]);

  const generateSRT = (type: 'original' | 'translated') => {
    if (!result?.segments) return '';
    return result.segments
      .map((seg, idx) => {
        const formatTimeSrt = (secs: number) => {
          const h = Math.floor(secs / 3600).toString().padStart(2, '0');
          const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
          const s = Math.floor(secs % 60).toString().padStart(2, '0');
          const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0');
          return `${h}:${m}:${s},${ms}`;
        };

        const start = formatTimeSrt(seg.startSeconds);
        const end = formatTimeSrt(seg.endSeconds);
        const content = type === 'original' ? seg.originalText : seg.translatedText;

        return `${idx + 1}\n${start} --> ${end}\n${content}\n`;
      })
      .join('\n');
  };

  const generateTXT = (type: 'original' | 'translated', withTimestamps: boolean) => {
    if (!result?.segments) return '';
    return result.segments
      .map((seg) => {
        const text = type === 'original' ? seg.originalText : seg.translatedText;
        return withTimestamps ? `[${seg.startTime}] ${text}` : text;
      })
      .join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-black/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#111827] to-[#374151] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#111827]">copyme</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0071E3] border border-blue-100">
              Free AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
              <span>Supports:</span>
              <span className="font-semibold text-gray-700">YouTube</span>
              <span>•</span>
              <span className="font-semibold text-gray-700">TikTok</span>
              <span>•</span>
              <span className="font-semibold text-gray-700">Reels</span>
              <span>•</span>
              <span className="font-semibold text-gray-700">Threads</span>
              <span>•</span>
              <span className="font-semibold text-gray-700">X</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full flex-grow flex flex-col">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111827] leading-tight">
            Transcribe & translate video links instantly.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 font-normal">
            Paste any public video link from YouTube, TikTok, Instagram, Threads, or X to generate structured transcripts and translations.
          </p>
        </div>

        {/* Input Form Box */}
        <div className="w-full max-w-3xl mx-auto mb-10">
          <form
            onSubmit={handleTranscribe}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.08] shadow-xl shadow-black/[0.03] transition-all focus-within:border-gray-400 focus-within:shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-grow flex items-center">
                <input
                  type="url"
                  placeholder="Paste YouTube, TikTok, Reels, Threads, or X URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full pl-4 pr-16 py-3.5 bg-transparent text-sm sm:text-base text-[#111827] placeholder:text-gray-400 focus:outline-none disabled:opacity-60 font-medium"
                />
                {!url && (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="absolute right-2 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200/70 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                )}
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-3 p-1 text-xs text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Target Language Dropdown */}
              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-200/80 pt-2 sm:pt-0 sm:pl-2">
                <div className="relative min-w-[130px]">
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    disabled={isLoading}
                    className="w-full appearance-none bg-gray-50/80 hover:bg-gray-100/80 text-xs sm:text-sm font-semibold text-gray-700 py-3.5 pl-3 pr-8 rounded-xl border border-gray-200/60 focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <Globe2 className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="flex-shrink-0 bg-[#111827] hover:bg-black text-white px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing</span>
                    </>
                  ) : (
                    <>
                      <span>Transcribe</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Platform detection indicator */}
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-400">
            <span>Detected Format:</span>
            <span className="font-semibold text-gray-700 capitalize bg-white/70 px-2 py-0.5 rounded-md border border-gray-200/50">
              {detectedPlatform === 'generic' ? 'Auto Detect' : detectedPlatform}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-sm flex items-start gap-3 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Processing Failed</p>
                <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="w-full max-w-5xl mx-auto space-y-4 animate-pulse">
            <div className="h-10 bg-gray-200/70 rounded-xl w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200/50 rounded-2xl border border-gray-200/40" />
              <div className="h-96 bg-gray-200/50 rounded-2xl border border-gray-200/40" />
            </div>
          </div>
        )}

        {/* Results Workspace */}
        {result && !isLoading && (
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Header Toolbar */}
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 capitalize">
                    {result.platform}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium text-gray-500">
                    Source: <strong className="text-gray-800">{result.sourceLanguage}</strong> → Target: <strong className="text-gray-800">{result.targetLanguage}</strong>
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-900 mt-1 truncate" title={result.title}>
                  {result.title || 'Untitled Video Transcript'}
                </h2>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search in transcript */}
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:bg-white w-full sm:w-44 font-medium"
                  />
                </div>

                {/* Timestamp Toggle */}
                <button
                  type="button"
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                    showTimestamps
                      ? 'bg-blue-50 text-[#0071E3] border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timestamps</span>
                </button>

                {/* View Switcher Mobile/Tablet */}
                <div className="flex lg:hidden bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      activeTab === 'original' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setActiveTab('translated')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      activeTab === 'translated' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Translated
                  </button>
                </div>
              </div>
            </div>

            {/* Dual Panes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Pane: Original Transcript */}
              <div
                className={`rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-sm flex flex-col h-[560px] ${
                  activeTab === 'translated' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Pane Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Original Transcript ({result.sourceLanguage})
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(generateTXT('original', showTimestamps), 'orig-all')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 border border-gray-200/60"
                      title="Copy Original Text"
                    >
                      {copiedKey === 'orig-all' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'orig-all' ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => downloadFile(generateTXT('original', showTimestamps), `copyme-original.txt`, 'text/plain')}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/60"
                      title="Download as TXT"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => downloadFile(generateSRT('original'), `copyme-original.srt`, 'text/plain')}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/60 flex items-center gap-1"
                      title="Download as Subtitles SRT"
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>SRT</span>
                    </button>
                  </div>
                </div>

                {/* Pane Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {filteredSegments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      No matching dialogue found.
                    </div>
                  ) : (
                    filteredSegments.map((seg) => (
                      <div
                        key={`orig-${seg.id}`}
                        className="group p-2.5 rounded-xl hover:bg-gray-50/80 transition-colors flex items-start gap-3 text-sm leading-relaxed"
                      >
                        {showTimestamps && (
                          <span className="flex-shrink-0 text-xs font-mono font-medium text-blue-600 bg-blue-50/70 px-1.5 py-0.5 rounded border border-blue-100">
                            {seg.startTime}
                          </span>
                        )}
                        <p className="flex-1 text-gray-800 font-normal">{seg.originalText}</p>
                        <button
                          onClick={() => copyToClipboard(seg.originalText, `orig-seg-${seg.id}`)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 transition-opacity"
                          title="Copy Segment"
                        >
                          {copiedKey === `orig-seg-${seg.id}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Pane: Translated Transcript */}
              <div
                className={`rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-sm flex flex-col h-[560px] ${
                  activeTab === 'original' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Pane Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Translated ({result.targetLanguage})
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(generateTXT('translated', showTimestamps), 'trans-all')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 border border-gray-200/60"
                      title="Copy Translated Text"
                    >
                      {copiedKey === 'trans-all' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'trans-all' ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => downloadFile(generateTXT('translated', showTimestamps), `copyme-translated-${result.targetLanguage.toLowerCase()}.txt`, 'text/plain')}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/60"
                      title="Download as TXT"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => downloadFile(generateSRT('translated'), `copyme-translated-${result.targetLanguage.toLowerCase()}.srt`, 'text/plain')}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/60 flex items-center gap-1"
                      title="Download as Subtitles SRT"
                    >
                      <Subtitles className="w-3.5 h-3.5" />
                      <span>SRT</span>
                    </button>
                  </div>
                </div>

                {/* Pane Content */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {filteredSegments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                      No matching translation found.
                    </div>
                  ) : (
                    filteredSegments.map((seg) => (
                      <div
                        key={`trans-${seg.id}`}
                        className="group p-2.5 rounded-xl hover:bg-blue-50/40 transition-colors flex items-start gap-3 text-sm leading-relaxed"
                      >
                        {showTimestamps && (
                          <span className="flex-shrink-0 text-xs font-mono font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                            {seg.startTime}
                          </span>
                        )}
                        <p className="flex-1 text-gray-800 font-normal">{seg.translatedText}</p>
                        <button
                          onClick={() => copyToClipboard(seg.translatedText, `trans-seg-${seg.id}`)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 transition-opacity"
                          title="Copy Segment"
                        >
                          {copiedKey === `trans-seg-${seg.id}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-black/[0.05] py-6 backdrop-blur-md bg-white/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} copyme. Zero-cost AI multi-platform video transcription.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini API</span>
            <span>•</span>
            <span>Vercel Edge Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
