# reflectapp — Sample Service for ECS Fargate Deployment Pipeline

This repository contains **reflectapp**, a minimal Node.js microservice used to test your **ECS Fargate deployment pipeline with zero-traffic checking (SQS-based)**.

It includes:
- A production-ready Express service  
- `/health` endpoint (for ECS health checks)  
- `/enqueue` endpoint (to send a message to SQS)  
- Graceful shutdown for ECS task draining  
- Dockerfile, task definition and CI/CD compatibility

---

## 1. Features

- Lightweight Node.js backend (Express)
- `/health` → returns `200` for ALB & ECS health checks
- `/` → simple info endpoint
- `/enqueue` → pushes messages to SQS (optional)
- Graceful shutdown for Fargate task draining
- Clean Dockerfile + .dockerignore
- Compatible with your Jenkins ECS deployment pipeline

---

## 2. Local Development

### Install dependencies
```bash
npm ci
Run locally
PORT=8000 node index.js

Test health
curl http://localhost:8000/health

Test main endpoint
curl http://localhost:8000/

Test enqueue (requires AWS creds + SQS queue)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"payload":"hello"}' \
  http://localhost:8000/enqueue

3. Docker Usage
Build image
docker build -t reflectapp:local .

Run container locally
docker run -p 8000:8000 \
  -e AWS_REGION=ap-south-1 \
  -e SQS_QUEUE_URL=<your-sqs-url> \
  reflectapp:local

Test container health
curl http://localhost:8000/health

4. Environment Variables
Name	Required	Description
PORT	No	Port to run application (default: 8000)
NODE_ENV	No	production or development
AWS_REGION	Yes	AWS Region (default: ap-south-1)
SQS_QUEUE_URL	No	SQS queue to send /enqueue messages
5. ECS Task Definition Integration

This project includes a ready-to-use taskdef.json.

Replace the following fields before deployment:

REPLACE_ME_ACCOUNT_ID

REPLACE_ME_EXECUTION_ROLE

REPLACE_ME_TASK_ROLE

REPLACE_ME_IMAGE_PLACEHOLDER

REPLACE_ME_SQS_QUEUE_URL

Your Jenkins pipeline will patch the image field automatically.

6. CI/CD Integration (Jenkins)

This project is designed for the pipeline you requested:

Build Docker image

Push to ECR

Check SQS queue

Scale service to 0

Register new Task Definition

Update ECS Service

Scale back to previous count

Place the following in your Jenkins job:

Pipeline script from SCM


Point to this repo.

Ensure Jenkins has AWS credentials configured.

7. Testing the Zero-Traffic Flow
1. Insert a message into SQS
aws sqs send-message \
  --region ap-south-1 \
  --queue-url <QUEUE_URL> \
  --message-body "test"

2. Run the Jenkins pipeline

Pipeline should STOP (because queue not empty).

3. Clear the queue

Wait for queue message count to reach zero.

4. Re-run pipeline

Pipeline should now:

Scale tasks to 0

Deploy new Task Definition

Scale back up

8. Project Structure
.
├── index.js
├── Dockerfile
├── .dockerignore
├── package.json
├── taskdef.json
└── README.md

9. Health Check Behavior

ECS Task Definition uses:

curl -f http://localhost:8000/health || exit 1


So ensure the app responds quickly.

10. IAM Requirements
Execution Role

Must include:

AmazonECSTaskExecutionRolePolicy

Task Role

Must include SQS permissions if /enqueue is used:

sqs:SendMessage

sqs:GetQueueAttributes

11. Notes

No secrets stored in code — use AWS SSM or Secrets Manager.

Logs go to CloudWatch Log Group: /ecs/reflectapp

Uses Node.js 18 Alpine for small image size.

SQS usage is optional — if not provided, /enqueue returns 400.

12. License

MIT License. You can use, modify, or extend this service as needed.

