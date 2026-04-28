import os

from langchain_ollama import OllamaEmbeddings

_DEFAULT_OLLAMA_BASE = "http://localhost:11434"


def get_embeddings():
    return OllamaEmbeddings(
        model=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        base_url=os.getenv("OLLAMA_BASE_URL", _DEFAULT_OLLAMA_BASE),
    )
