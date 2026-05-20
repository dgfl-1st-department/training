#!/usr/bin/env bash
# EC2 初回セットアップ用スクリプト（Amazon Linux 2023 / Ubuntu 22.04 想定）
# 使い方: EC2 に SSH 接続後、このスクリプトを実行する
#   curl -fsSL <raw-url>/scripts/ec2-bootstrap.sh | bash
# またはリポジトリ clone 後:
#   bash scripts/ec2-bootstrap.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/training}"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"
REPO_URL="${REPO_URL:-}"

echo "==> Docker のインストール"
if command -v docker &>/dev/null; then
  echo "Docker は既にインストール済みです"
else
  if [ -f /etc/os-release ]; then
    # shellcheck source=/dev/null
    . /etc/os-release
  fi

  case "${ID:-}" in
    amzn|amazon)
      sudo dnf update -y
      sudo dnf install -y docker git
      sudo systemctl start docker
      sudo systemctl enable docker
      ;;
    ubuntu|debian)
      sudo apt-get update -y
      sudo apt-get install -y ca-certificates curl git
      sudo install -m 0755 -d /etc/apt/keyrings
      sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
      sudo chmod a+r /etc/apt/keyrings/docker.asc
      echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" |
        sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
      sudo apt-get update -y
      sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
      sudo systemctl start docker
      sudo systemctl enable docker
      ;;
    *)
      echo "未対応の OS です。手動で Docker と Docker Compose V2 をインストールしてください。"
      exit 1
      ;;
  esac
fi

sudo usermod -aG docker "${DEPLOY_USER}"
echo "※ docker グループを反映するため、一度ログアウトして再ログインしてください"

echo "==> アプリ配置ディレクトリの作成: ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
sudo chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

if [ -n "${REPO_URL}" ] && [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi

echo "==> デプロイ用 SSH 鍵の生成（未存在の場合）"
SSH_KEY="${HOME}/.ssh/github_actions_deploy"
if [ ! -f "${SSH_KEY}" ]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f "${SSH_KEY}" -N ""
  cat "${SSH_KEY}.pub" >> "${HOME}/.ssh/authorized_keys"
  chmod 600 "${HOME}/.ssh/authorized_keys"
  echo ""
  echo "以下の秘密鍵を GitHub Repository Secrets (EC2_SSH_PRIVATE_KEY) に登録してください:"
  echo "----------------------------------------"
  cat "${SSH_KEY}"
  echo "----------------------------------------"
else
  echo "SSH 鍵は既に存在します: ${SSH_KEY}"
fi

echo ""
echo "==> 次の手順"
echo "1. ${APP_DIR}/.env を .env_example を参考に作成する"
echo "2. GOOGLE_CALLBACK_URL を http://<EC2_PUBLIC_IP>/api/auth/callback に設定する"
echo "3. Google Cloud Console に上記 URL を承認済みリダイレクト URI として追加する"
echo "4. GitHub Secrets に EC2_HOST, EC2_USER, EC2_SSH_PRIVATE_KEY を登録する"
echo "5. セキュリティグループでポート 22 (SSH) と 80 (HTTP) を開放する"
echo "6. docker compose -f docker-compose.prod.yml up -d --build で起動確認する"
