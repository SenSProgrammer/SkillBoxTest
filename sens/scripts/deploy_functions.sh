#!/usr/bin/env bash
set -e

# Требуется: yc cli, jq
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Packaging functions"
cd functions/now-shanti-analyze && zip -qr ../../now-shanti-analyze.zip . && cd - >/dev/null
cd functions/ai-router && zip -qr ../../ai-router.zip . && cd - >/dev/null

echo "==> Creating functions (ignore errors if already exist)"
yc serverless function create --name now-shanti-analyze || true
yc serverless function create --name ai-router || true

echo "==> Deploying versions"
SH_VER=$(yc serverless function version create   --function-name now-shanti-analyze   --runtime nodejs18   --entrypoint index.handler   --memory 256m   --execution-timeout 10s   --source-path functions/now-shanti-analyze.zip   --format json | jq -r '.id')

AI_VER=$(yc serverless function version create   --function-name ai-router   --runtime nodejs18   --entrypoint index.handler   --memory 256m   --execution-timeout 10s   --source-path functions/ai-router.zip   --format json | jq -r '.id')

SH_ID=$(yc serverless function get --name now-shanti-analyze --format json | jq -r '.id')
AI_ID=$(yc serverless function get --name ai-router --format json | jq -r '.id')

echo "now-shanti-analyze id: $SH_ID"
echo "ai-router id:         $AI_ID"

echo "==> Writing API Gateway spec"
sed "s#<FUNCTION_ID_SHANTI>#${SH_ID}#; s#<FUNCTION_ID_ROUTER>#${AI_ID}#" infra/apigw-shanti.yaml > infra/_apigw-gen.yaml

echo "==> Creating/Updating API Gateway"
if yc serverless api-gateway get --name sens-now >/dev/null 2>&1; then
  yc serverless api-gateway update --name sens-now --spec=infra/_apigw-gen.yaml >/dev/null
else
  yc serverless api-gateway create --name sens-now --spec=infra/_apigw-gen.yaml >/dev/null
fi

DOMAIN=$(yc serverless api-gateway get --name sens-now --format json | jq -r '.domain')
echo "API Gateway domain: https://${DOMAIN}"
echo "Done."
