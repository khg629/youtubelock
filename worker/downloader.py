import os
import threading
import yt_dlp
from typing import Dict, Optional

DOWNLOAD_DIR = os.environ.get("DOWNLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "downloads"))

# In-memory job store (replaces Redis for local dev)
_jobs: Dict[str, dict] = {}
_jobs_lock = threading.Lock()


def update_job_status(job_id: str, status: str, **kwargs):
    with _jobs_lock:
        if job_id not in _jobs:
            _jobs[job_id] = {}
        _jobs[job_id]["status"] = status
        _jobs[job_id].update(kwargs)


def get_job_status(job_id: str) -> Optional[dict]:
    with _jobs_lock:
        return _jobs.get(job_id, {}).copy() or None


def fetch_video_info(url: str, oauth_token: Optional[str] = None) -> dict:
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }
    if oauth_token:
        ydl_opts["http_headers"] = {"Authorization": f"Bearer {oauth_token}"}

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        formats = []
        for f in info.get("formats", []):
            if f.get("vcodec") != "none" and f.get("acodec") != "none":
                formats.append({
                    "format_id": f["format_id"],
                    "ext": f.get("ext", "mp4"),
                    "resolution": f.get("resolution", "unknown"),
                    "filesize": f.get("filesize") or f.get("filesize_approx"),
                })

        return {
            "id": info["id"],
            "title": info.get("title", ""),
            "thumbnail": info.get("thumbnail", ""),
            "duration": info.get("duration", 0),
            "uploader": info.get("uploader", ""),
            "formats": formats,
        }


def download_video(job_id: str, url: str, format_id: Optional[str] = None, oauth_token: Optional[str] = None):
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    def progress_hook(d):
        if d["status"] == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            percent = (downloaded / total * 100) if total > 0 else 0
            update_job_status(
                job_id,
                status="downloading",
                progress=round(percent, 1),
                speed=d.get("speed", 0) or 0,
                eta=d.get("eta", 0) or 0,
            )
        elif d["status"] == "finished":
            update_job_status(job_id, status="processing", progress=100)

    ydl_opts = {
        "outtmpl": os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s"),
        "progress_hooks": [progress_hook],
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
    }

    if format_id:
        ydl_opts["format"] = format_id
    else:
        ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"

    if oauth_token:
        ydl_opts["http_headers"] = {"Authorization": f"Bearer {oauth_token}"}

    update_job_status(job_id, status="downloading", progress=0)

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            # yt-dlp may change extension after merge
            if not os.path.exists(filename):
                base = os.path.splitext(filename)[0]
                for ext in [".mp4", ".webm", ".mkv"]:
                    if os.path.exists(base + ext):
                        filename = base + ext
                        break

            filesize = os.path.getsize(filename) if os.path.exists(filename) else 0
            update_job_status(
                job_id,
                status="completed",
                progress=100,
                filename=os.path.basename(filename),
                title=info.get("title", ""),
                filesize=filesize,
            )
            return filename
    except Exception as e:
        update_job_status(job_id, status="failed", error=str(e))
        raise
