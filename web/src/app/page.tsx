"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import VideoInfo from "@/components/VideoInfo";
import DownloadProgress from "@/components/DownloadProgress";
import AuthButton from "@/components/AuthButton";

interface VideoInfoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  formats: { format_id: string; ext: string; resolution: string; filesize: number | null }[];
}

export default function Home() {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfoData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  async function handleFetchInfo() {
    if (!url.trim()) return;
    setError(null);
    setVideoInfo(null);
    setJobId(null);
    setLoading(true);

    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, oauth_token: accessToken }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setVideoInfo(data);
      }
    } catch {
      setError("영상 정보를 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(formatId?: string) {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format_id: formatId, oauth_token: accessToken }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setJobId(data.job_id);
      }
    } catch {
      setError("다운로드 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const handleComplete = useCallback(() => {
    // Download completed - UI updates via DownloadProgress component
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleFetchInfo();
  }

  function handleReset() {
    setVideoInfo(null);
    setJobId(null);
    setError(null);
    setUrl("");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <AuthButton />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            YouTube<span className="text-red-500">Lock</span>
          </h1>
          <p className="text-gray-400">비공개 & 일부공개 YouTube 영상 다운로드</p>
          {!session && (
            <p className="text-gray-600 text-xs mt-2">
              비공개 영상을 다운로드하려면 Google 로그인이 필요합니다
            </p>
          )}
        </header>

        <div className="space-y-6">
          {/* URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="YouTube URL을 붙여넣으세요"
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              onClick={handleFetchInfo}
              disabled={loading || !url.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-medium transition-colors whitespace-nowrap"
            >
              {loading ? "로딩..." : "정보 가져오기"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Video Info */}
          {videoInfo && !jobId && (
            <VideoInfo info={videoInfo} onDownload={handleDownload} loading={loading} />
          )}

          {/* Download Progress */}
          {jobId && <DownloadProgress jobId={jobId} onComplete={handleComplete} />}

          {/* Reset button */}
          {(videoInfo || jobId) && (
            <button
              onClick={handleReset}
              className="w-full text-gray-500 hover:text-white text-sm py-2 transition-colors"
            >
              새 영상 다운로드
            </button>
          )}
        </div>

        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>본인이 접근 권한을 가진 영상만 다운로드하세요.</p>
        </footer>
      </div>
    </div>
  );
}
