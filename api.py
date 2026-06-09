"""
FastAPI backend for the PDF RAG chatbot.
Run: uvicorn api:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import shutil
import time
import uuid
from pathlib import Path
from threading import Lock
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.embeddings import get_embeddings
from src.loader import load_pdf
from src.rag_chain import create_qa_chain
from src.splitter import split_docs
from src.vectorstore import create_vectorstore

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads"
UPLOAD_ROOT.mkdir(exist_ok=True)

SESSIONS: dict[str, dict[str, Any]] = {}
SESSION_LOCK = Lock()


class AskBody(BaseModel):
    session_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)


app = FastAPI(title="PDF RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)) -> dict[str, Any]:
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    pdf_files = [
        f for f in files if f.filename and f.filename.lower().endswith(".pdf")
    ]
    if not pdf_files:
        raise HTTPException(
            status_code=400, detail="Upload at least one PDF file (.pdf)"
        )

    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_ROOT / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    all_docs = []
    try:
        for file in pdf_files:
            safe_name = Path(file.filename).name
            dest = session_dir / f"temp_{safe_name}"
            content = await file.read()
            dest.write_bytes(content)
            docs = load_pdf(str(dest))
            all_docs.extend(docs)

        if not all_docs:
            shutil.rmtree(session_dir, ignore_errors=True)
            raise HTTPException(
                status_code=400,
                detail="No text could be extracted from the uploaded PDF(s)",
            )

        split_documents = split_docs(all_docs)
        chunks_indexed = len(split_documents)
        embeddings = get_embeddings()
        vectorstore = create_vectorstore(split_documents, embeddings)
        qa_chain = create_qa_chain(vectorstore)

        with SESSION_LOCK:
            SESSIONS[session_id] = {
                "chain": qa_chain,
                "files_processed": len(pdf_files),
                "chunks_indexed": chunks_indexed,
            }

        return {
            "session_id": session_id,
            "files_processed": len(pdf_files),
            "chunks_indexed": chunks_indexed,
            "status": "ready",
        }
    except HTTPException:
        shutil.rmtree(session_dir, ignore_errors=True)
        with SESSION_LOCK:
            SESSIONS.pop(session_id, None)
        raise
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        with SESSION_LOCK:
            SESSIONS.pop(session_id, None)
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/ask")
def ask(body: AskBody) -> dict[str, Any]:
    with SESSION_LOCK:
        sess = SESSIONS.get(body.session_id)

    if not sess:
        raise HTTPException(
            status_code=404,
            detail="Invalid or unknown session_id. Upload PDFs again.",
        )

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    chain = sess["chain"]
    start = time.perf_counter()
    try:
        result = chain.invoke({"question": question})
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Model or retrieval error: {e!s}"
        ) from e

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    answer = result.get("answer", "") if isinstance(result, dict) else str(result)

    return {
        "answer": answer,
        "status": "ok",
        "latency_ms": elapsed_ms,
    }


@app.delete("/session/{session_id}")
def delete_session(session_id: str) -> dict[str, str]:
    with SESSION_LOCK:
        removed = SESSIONS.pop(session_id, None) is not None

    session_dir = UPLOAD_ROOT / session_id
    if session_dir.exists():
        shutil.rmtree(session_dir, ignore_errors=True)

    if not removed and not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    return {"status": "deleted"}
