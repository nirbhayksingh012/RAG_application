# AI PDF Chatbot (React + FastAPI + RAG)

Multi-PDF Q&A using LangChain, Ollama embeddings/LLM, and FAISS. The **UI is React + Tailwind**; the **API is FastAPI**.

## Prerequisites

- Python 3.10+
- [Ollama](https://ollama.com/) running locally with:
  - Embedding model (default: `nomic-embed-text`)
  - Chat model (set via `OLLAMA_MODEL` in `.env`)
- Node.js 20+ (for the frontend)

## Backend setup

```bash
cd ai-pdf-chatbot
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `.env` (see values used in `src/embeddings.py` and `src/rag_chain.py`):

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_MODEL=your-chat-model-name
```

Start the API:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Or:

```bash
python app.py
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api/*` to `http://127.0.0.1:8000`.

### Production / custom API URL

Build the frontend and point it at your API:

```bash
cd frontend
echo VITE_API_URL=http://127.0.0.1:8000 > .env.production
npm run build
```

Serve `frontend/dist` as static files or run `npm run preview`.

## API

| Method | Path | Description |
|--------|------|--------------|
| GET | `/health` | Health check |
| POST | `/upload` | Multipart form field `files` (PDFs) → `{ session_id, files_processed, chunks_indexed, status }` |
| POST | `/ask` | JSON `{ session_id, question }` → `{ answer, status, latency_ms }` |
| DELETE | `/session/{session_id}` | Remove session and uploaded files |

## Notes

- Indexed PDF bytes are stored under `uploads/<session_id>/`.
- Streamlit was removed; use the React app for all UI.
