import os

from langchain_classic.chains import ConversationalRetrievalChain
from langchain_classic.memory import ConversationBufferMemory
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_ollama import ChatOllama

_DEFAULT_OLLAMA_BASE = "http://localhost:11434"

_QA_SYSTEM = """You answer using only the excerpts below. They are text retrieved from the user's uploaded PDF(s).
Do not say you cannot see the PDF, that no file was provided, or that you only have general knowledge—the excerpts are the document.
If the excerpts do not contain enough information to answer, say what is missing or that it is not in the uploaded document(s).

----------------
{context}"""

QA_PROMPT = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(_QA_SYSTEM),
        HumanMessagePromptTemplate.from_template("{question}"),
    ]
)


def create_qa_chain(vectorstore):
    llm = ChatOllama(
        model=os.getenv(
            "OLLAMA_MODEL",
            "llama3.2:latest",
        ),
        temperature=0,
        base_url=os.getenv("OLLAMA_BASE_URL", _DEFAULT_OLLAMA_BASE),
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
    )

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": QA_PROMPT},
    )
