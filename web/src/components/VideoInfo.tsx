"use client";

interface Format {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
}

interface VideoInfoProps {
  info: {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    uploader: string;
    formats: Format[];
  };
  onDownload: (formatId?: string) => void;
  loading: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function VideoInfo({ info, onDownload, loading }: VideoInfoProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <div className="flex gap-4">
        {info.thumbnail && (
          <img
            src={info.thumbnail}
            alt={info.title}
            className="w-48 h-auto rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{info.title}</h2>
          <p className="text-gray-400 text-sm">{info.uploader}</p>
          <p className="text-gray-500 text-sm">{formatDuration(info.duration)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-300">해상도 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDownload()}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            최고 화질 다운로드
          </button>
          {info.formats.slice(0, 5).map((f) => (
            <button
              key={f.format_id}
              onClick={() => onDownload(f.format_id)}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm transition-colors text-left"
            >
              <span>{f.resolution}</span>
              <span className="text-gray-500 ml-2">{f.ext}</span>
              {f.filesize && (
                <span className="text-gray-500 ml-2">{formatSize(f.filesize)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
