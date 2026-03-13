# Pythonとuvがインストール済みの公式イメージを使用
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係のコピーとインストール（キャッシュを活かすため先に実行）
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# ソースコードのコピー
COPY . .

# ポートの開放
EXPOSE 8000

# サーバーの起動（--host 0.0.0.0 が必須）
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

