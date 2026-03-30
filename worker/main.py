import uuid
import os
import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

from downloader import (
    fetch_video_info,
    download_video,
    update_job_status,
    get_job_status,
    DOWNLOAD_DIR,
)

app = FastAPI(title="YouTubeLock Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class InfoRequest(BaseModel):
    url: str
    oauth_token: Optional[str] = None


class DownloadRequest(BaseModel):
    url: str
    format_id: Optional[str] = None
    oauth_token: Optional[str] = None


@app.post("/info")
async def get_info(req: InfoRequest):
    try:
        info = fetch_video_info(req.url, req.oauth_token)
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/download")
async def request_download(req: DownloadRequest):
    job_id = str(uuid.uuid4())
    update_job_status(job_id, status="pending", url=req.url)

    # Run download in background thread
    def run():
        try:
            download_video(
                job_id=job_id,
                url=req.url,
                format_id=req.format_id,
                oauth_token=req.oauth_token,
            )
        except Exception as e:
            print(f"Download error for {job_id}: {e}")

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return {"job_id": job_id, "status": "pending"}


@app.get("/status/{job_id}")
async def get_status(job_id: str):
    data = get_job_status(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return data


@app.get("/file/{job_id}")
async def get_file(job_id: str):
    data = get_job_status(job_id)
    if not data or data.get("status") != "completed":
        raise HTTPException(status_code=404, detail="File not ready")

    filename = data.get("filename", "")
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    title = data.get("title", "video")
    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip() or "video"
    ext = os.path.splitext(filename)[1]

    return FileResponse(
        filepath,
        media_type="application/octet-stream",
        filename=f"{safe_title}{ext}",
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
