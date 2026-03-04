# 部署说明

## 前提条件

- 云服务器（推荐 2 核 4G，Ubuntu 20.04+）
- 已安装 Docker 和 Docker Compose
- 已准备 LLM API Key（推荐 DeepSeek，费用低）

## 部署步骤

### 第一步：克隆代码

```bash
git clone <仓库地址>
cd AI-Finance
```

### 第二步：配置 API Key

```bash
cp .env.example .env
vim .env
```

按实际情况修改以下内容：

```
LLM_PROVIDER=deepseek          # 使用 DeepSeek（推荐）
DEEPSEEK_API_KEY=sk-你的key     # 填入真实 Key

NEXT_PUBLIC_API_BASE_URL=http://你的服务器IP:8000
```

### 第三步：生成模拟数据

```bash
cd backend
pip install pandas numpy
python data/generate_mock_data.py
cd ..
```

### 第四步：启动服务

```bash
docker compose up -d
```

等待约 3-5 分钟（首次构建镜像）。

### 第五步：访问验证

| 地址 | 说明 |
|------|------|
| `http://服务器IP:3000` | 前端门户（学生访问） |
| `http://服务器IP:8000` | 后端 API |
| `http://服务器IP:8000/docs` | API 文档 |

## 常用命令

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down

# 更新代码后重启
git pull
docker compose up -d --build
```

## 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
python data/generate_mock_data.py   # 首次运行
python main.py

# 前端（新终端）
cd frontend
npm install
npm run dev
```

访问 `http://localhost:3000`

## 注意事项

- `.env` 文件含 API Key，**禁止提交到 Git**
- DeepSeek API 价格约为 OpenAI 的 1/10，适合教学场景
- 模拟股票数据仅供教学，不代表真实行情
- 所有 AI 生成内容不构成投资建议
