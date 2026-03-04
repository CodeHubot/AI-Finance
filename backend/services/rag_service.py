"""案例1：RAG 金融知识库服务（使用 FAISS 向量存储）"""
import os
import uuid
import json
import tempfile
import pickle
from typing import List, AsyncGenerator
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from dotenv import load_dotenv

from services.llm_client import get_llm_client, get_model_name

load_dotenv()

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

FAISS_INDEX_PATH = DATA_DIR / "faiss_index"
DOC_META_FILE = DATA_DIR / "documents.json"


def _load_doc_meta() -> List[dict]:
    if DOC_META_FILE.exists():
        return json.loads(DOC_META_FILE.read_text(encoding="utf-8"))
    return []


def _save_doc_meta(docs: List[dict]):
    DOC_META_FILE.write_text(json.dumps(docs, ensure_ascii=False, indent=2), encoding="utf-8")


def _get_embedder() -> OpenAIEmbeddings:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "deepseek":
        return OpenAIEmbeddings(
            openai_api_key=os.getenv("DEEPSEEK_API_KEY", ""),
            openai_api_base=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
            model="text-embedding-ada-002",
        )
    elif provider == "tongyi":
        return OpenAIEmbeddings(
            openai_api_key=os.getenv("TONGYI_API_KEY", ""),
            openai_api_base=os.getenv("TONGYI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            model="text-embedding-v1",
        )
    else:
        return OpenAIEmbeddings(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            model="text-embedding-ada-002",
        )


def _load_vectorstore() -> FAISS:
    """加载已有向量库，如不存在则返回 None"""
    if FAISS_INDEX_PATH.exists():
        embedder = _get_embedder()
        return FAISS.load_local(
            str(FAISS_INDEX_PATH),
            embedder,
            allow_dangerous_deserialization=True,
        )
    return None


def _save_vectorstore(vs: FAISS):
    vs.save_local(str(FAISS_INDEX_PATH))


async def upload_document(file_content: bytes, filename: str) -> dict:
    """上传文档并向量化存储"""
    suffix = Path(filename).suffix.lower()
    doc_id = str(uuid.uuid4())[:8]

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path, encoding="utf-8")

        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", "。", "！", "？", "，", " "],
        )
        chunks = splitter.split_documents(docs)

        # 为每个 chunk 添加文档 ID 元数据
        for i, chunk in enumerate(chunks):
            chunk.metadata["doc_id"] = doc_id
            chunk.metadata["filename"] = filename
            chunk.metadata["chunk_index"] = i

        embedder = _get_embedder()
        new_vs = FAISS.from_documents(chunks, embedder)

        existing_vs = _load_vectorstore()
        if existing_vs is not None:
            existing_vs.merge_from(new_vs)
            _save_vectorstore(existing_vs)
        else:
            _save_vectorstore(new_vs)

        texts = [c.page_content for c in chunks]
        doc_info = {
            "id": doc_id,
            "filename": filename,
            "chunk_count": len(chunks),
            "status": "已向量化",
            "preview_chunks": [
                {"index": i, "text": t[:120] + "..." if len(t) > 120 else t}
                for i, t in enumerate(texts[:5])
            ],
        }

        metas = _load_doc_meta()
        metas.append(doc_info)
        _save_doc_meta(metas)

        return doc_info
    finally:
        os.unlink(tmp_path)


def list_documents() -> List[dict]:
    return _load_doc_meta()


def delete_document(doc_id: str) -> bool:
    """删除文档（重建索引）"""
    metas = _load_doc_meta()
    metas = [m for m in metas if m["id"] != doc_id]
    _save_doc_meta(metas)

    # 如果没有其他文档则删除索引
    if not metas:
        if FAISS_INDEX_PATH.exists():
            import shutil
            shutil.rmtree(FAISS_INDEX_PATH)
    return True


async def chat_with_rag(
    question: str,
    system_prompt: str,
    top_k: int = 4,
) -> AsyncGenerator[dict, None]:
    """RAG 问答，流式输出"""
    sources = []
    context_parts = []

    vs = _load_vectorstore()
    if vs is not None:
        try:
            results = vs.similarity_search_with_score(question, k=top_k)
            for doc, score in results:
                sources.append({
                    "filename": doc.metadata.get("filename", "未知"),
                    "chunk_index": doc.metadata.get("chunk_index", 0),
                    "text": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "relevance": round(float(1 / (1 + score)), 3),
                })
                context_parts.append(
                    f"【来源：{doc.metadata.get('filename')} 第{doc.metadata.get('chunk_index', 0)+1}段】\n{doc.page_content}"
                )
        except Exception:
            pass

    context = "\n\n".join(context_parts) if context_parts else "（知识库暂无相关文档，请直接回答）"

    full_system = f"""{system_prompt}

你可以参考以下金融知识库内容回答问题（如果相关）：
---
{context}
---
请基于以上内容和你的金融专业知识，给出准确、专业的回答。如果引用了知识库内容，请标注来源。"""

    yield {"type": "sources", "sources": sources}

    client = get_llm_client()
    stream = await client.chat.completions.create(
        model=get_model_name(),
        messages=[
            {"role": "system", "content": full_system},
            {"role": "user", "content": question},
        ],
        stream=True,
        temperature=0.3,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield {"type": "token", "token": delta.content}

    yield {"type": "done"}
