FROM python:3.11-slim

WORKDIR /app

# 切换 apt 为阿里云镜像（加速国内构建）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's|http://deb.debian.org|https://mirrors.aliyun.com|g' /etc/apt/sources.list

# 系统依赖（PDF 解析 + FAISS 需要）
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# 使用阿里云 PyPI 镜像
RUN pip install --no-cache-dir -r requirements.txt \
    -i https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com

COPY . .

# 创建数据目录
RUN mkdir -p data/chroma

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
