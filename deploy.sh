#!/usr/bin/env bash
# =============================================================================
# Adapt — ECS Fargate deploy script
# Requires: AWS CLI v2, Docker, git
# Run from the repo root: bash deploy.sh
#
# One-time setup (run these manually before first deploy):
# -----------------------------------------------------------------------------
# 1. Create the ECS cluster:
#      aws ecs create-cluster --cluster-name adapt-cluster --region us-east-1
#
# 2. Ensure the ECS execution role exists (skip if it already does):
#      aws iam create-role \
#        --role-name ecsTaskExecutionRole \
#        --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
#      aws iam attach-role-policy \
#        --role-name ecsTaskExecutionRole \
#        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
#
# 3. Register the task definition for the first time:
#      aws ecs register-task-definition \
#        --cli-input-json file://ecs/task-definition.json \
#        --region us-east-1
#
# 4. Create the ECS service (replace SUBNET and SG placeholders):
#      aws ecs create-service \
#        --cluster adapt-cluster \
#        --service-name adapt-frontend \
#        --task-definition adapt-frontend \
#        --desired-count 1 \
#        --launch-type FARGATE \
#        --network-configuration "awsvpcConfiguration={subnets=[subnet-XXXXXXXX],securityGroups=[sg-XXXXXXXX],assignPublicIp=ENABLED}" \
#        --region us-east-1
#
#   To find your default VPC subnets and security groups:
#      aws ec2 describe-subnets --filters Name=default-for-az,Values=true --query 'Subnets[*].[SubnetId,AvailabilityZone]' --output table
#      aws ec2 describe-security-groups --filters Name=group-name,Values=default --query 'SecurityGroups[*].[GroupId,GroupName]' --output table
# =============================================================================
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="441586174904"
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/group11/adapt"
ECS_CLUSTER="${ECS_CLUSTER:-adapt-cluster}"
ECS_SERVICE="${ECS_SERVICE:-adapt-frontend}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

# Build-time env vars baked into the frontend bundle
VITE_API_URL="${VITE_API_URL:-http://localhost:8080/api/v1}"
VITE_USE_MOCK="${VITE_USE_MOCK:-false}"

# ── ECR login ─────────────────────────────────────────────────────────────────
echo "▶  ECR login"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin \
      "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# ── Build ─────────────────────────────────────────────────────────────────────
echo "▶  Building image  (tag: ${IMAGE_TAG})"
docker build \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  --build-arg VITE_USE_MOCK="$VITE_USE_MOCK" \
  -t "${ECR_REPO}:${IMAGE_TAG}" \
  -t "${ECR_REPO}:latest" \
  .

# ── Push ──────────────────────────────────────────────────────────────────────
echo "▶  Pushing to ECR"
docker push "${ECR_REPO}:${IMAGE_TAG}"
docker push "${ECR_REPO}:latest"

# ── Register task definition (pin the exact image tag) ────────────────────────
echo "▶  Registering task definition"
TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

sed "s|group11/adapt:latest|group11/adapt:${IMAGE_TAG}|g" \
  ecs/task-definition.json > "$TMPFILE"

NEW_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json "file://$TMPFILE" \
  --region "$AWS_REGION" \
  --query "taskDefinition.taskDefinitionArn" \
  --output text)

echo "   → ${NEW_TASK_ARN}"

# ── Update ECS service ────────────────────────────────────────────────────────
echo "▶  Updating ECS service"
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --task-definition "$NEW_TASK_ARN" \
  --force-new-deployment \
  --region "$AWS_REGION" \
  --output text > /dev/null

# ── Wait for stability ────────────────────────────────────────────────────────
echo "▶  Waiting for service to stabilise (may take ~2 min)…"
aws ecs wait services-stable \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region "$AWS_REGION"

echo "✓  Deployed ${ECR_REPO}:${IMAGE_TAG}"
