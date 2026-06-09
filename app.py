"""
PDF RAG chatbot entry point.

The UI is the React app in `frontend/`. Start the API server:

  uvicorn api:app --reload --host 0.0.0.0 --port 8000

Then in another terminal (from `frontend/`):

  npm run dev
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
