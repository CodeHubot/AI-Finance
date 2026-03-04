"""统一的 LLM 客户端，支持 OpenAI / DeepSeek / 通义千问"""
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()


def get_llm_client() -> AsyncOpenAI:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "deepseek":
        return AsyncOpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY", ""),
            base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
        )
    elif provider == "tongyi":
        return AsyncOpenAI(
            api_key=os.getenv("TONGYI_API_KEY", ""),
            base_url=os.getenv("TONGYI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        )
    else:
        return AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY", ""),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        )


def get_model_name() -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "deepseek":
        return os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    elif provider == "tongyi":
        return os.getenv("TONGYI_MODEL", "qwen-plus")
    else:
        return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
