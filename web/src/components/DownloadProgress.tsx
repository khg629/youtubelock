"use client";

import { useEffect, useState } from "react";

interface DownloadProgressProps {
  jobId: string;
  onComplete: () => void;
}

interface JobStatus {
  status: string;
  progress?: string;
  speed?: string;
  eta?: string;
  title?: string;
  filename?: string;
  filesize?: string;
  error?: string;
}

export default function DownloadProgress({ jobId, onComplete }: DownloadProgressProps) {
  const [status, setStatus] = useState<JobStatus>({ status: "pending" });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "completed") {
            onComplete();
          }
        }
      } catch {
        // retry on next interval
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const progress = parseFloat(status.progress || "0");
  const speed = parseFloat(status.speed || "0");
  const eta = parseInt(status.eta || "0", 10);

  function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }

  function formatEta(seconds: number): string {
    if (seconds <= 0) return "";
    if (seconds < 60) return `${seconds}초 남음`;
    return `${Math.floor(seconds / 60)}분 ${seconds % 60}초 남음`;
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">
          {status.status === "pending" && "대기 중..."}
          {status.status === "downloading" && "다운로드 중..."}
          {status.status === "processing" && "변환 중..."}
          {status.status === "completed" && "완료!"}
          {status.status === "failed" && "실패"}
        </h3>
        {status.status === "downloading" && speed > 0 && (
          <span className="text-gray-400 text-sm">{formatSpeed(speed)}</span>
        )}
      </div>

      {(status.status === "downloading" || status.status === "processing") && (
        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{progress.toFixed(1)}%</span>
            {eta > 0 && <span>{formatEta(eta)}</span>}
          </div>
        </div>
      )}

      {status.status === "completed" && (
        <a
          href={`/api/file/${jobId}`}
          className="block w-full text-center bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
        >
          파일 다운로드
        </a>
      )}

      {status.status === "failed" && (
        <p className="text-red-400 text-sm">{status.error || "알 수 없는 오류가 발생했습니다."}</p>
      )}
    </div>
  );
}
