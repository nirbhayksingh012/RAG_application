# 📄 Multi-PDF Conversational AI Chatbot

## 🚀 Overview
A Generative AI application that allows users to upload multiple PDFs and ask questions with conversation memory using a RAG pipeline.

## 🧠 Features
- Multi-PDF support
- Conversational memory
- Semantic search with FAISS
- Context-aware answers

## 🛠️ Tech Stack
- Python
- LangChain
- OpenAI API
- FAISS
- Streamlit

## ⚙️ How it Works
1. PDFs are loaded and split into chunks  
2. Chunks converted into embeddings  
3. Stored in FAISS vector DB  
4. Relevant chunks retrieved  
5. LLM generates contextual answers  

## ▶️ Run

```bash
pip install -r requirements.txt
streamlit run app.py