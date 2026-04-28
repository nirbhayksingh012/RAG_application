import streamlit as st
from dotenv import load_dotenv

from src.loader import load_pdf
from src.splitter import split_docs
from src.embeddings import get_embeddings
from src.vectorstore import create_vectorstore
from src.rag_chain import create_qa_chain

load_dotenv()

st.title("📄 Multi-PDF AI Chatbot")

uploaded_files = st.file_uploader("Upload PDFs", type="pdf", accept_multiple_files=True)

if uploaded_files:
    all_docs = []

    for file in uploaded_files:
        file_path = f"temp_{file.name}"
        with open(file_path, "wb") as f:
            f.write(file.read())

        docs = load_pdf(file_path)
        all_docs.extend(docs)

    split_documents = split_docs(all_docs)
    embeddings = get_embeddings()
    vectorstore = create_vectorstore(split_documents, embeddings)
    qa_chain = create_qa_chain(vectorstore)

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    query = st.text_input("Ask your question:")

    if query:
        result = qa_chain.invoke({"question": query})
        st.session_state.chat_history.append(("You", query))
        st.session_state.chat_history.append(("Bot", result["answer"]))

    for role, message in st.session_state.chat_history:
        st.write(f"**{role}:** {message}")
