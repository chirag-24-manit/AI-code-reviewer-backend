🧠 AI-Powered GitHub PR Reviewer

An automated Continuous Integration (CI) pipeline tool that leverages LLMs (Google Gemini) to automatically review GitHub Pull Requests.

Unlike standard linters that complain about missing semicolons, this tool acts as an automated Senior Security Auditor. It is engineered to specifically hunt for logic bugs, architectural flaws, and security vulnerabilities (like hardcoded secrets or SQL injections), and posts its findings directly to the GitHub UI as a comment.

🚀 Key Features

Automated PR Interception: Listens for opened or synchronize (updated) Pull Request events via GitHub Webhooks.

Enterprise-Grade Security: Utilizes HMAC SHA-256 cryptographic hashing to verify webhook signatures, instantly rejecting unauthenticated or malicious payloads.

Intelligent Code Analysis: Extracts raw Git diffs via REST API and processes them using Google's Gemini 2.5 Flash model for fast, high-context code review.

Seamless Feedback Loop: Uses the GitHub Issues API to securely post formatted Markdown comments directly onto the PR timeline.

Fail-Fast Architecture: Asynchronous processing prevents GitHub webhook timeout limits (10-second rule) while keeping server overhead low.

🛠️ Tech Stack

Backend: Node.js, Express.js

AI Engine: Google Gemini SDK (@google/genai)

Security: Native Node crypto module (HMAC SHA-256)

Integrations: GitHub Webhooks, GitHub REST API

⚙️ Architecture Flow

Developer opens a Pull Request on GitHub.

GitHub fires a JSON webhook payload containing an HMAC cryptographic signature.

Node.js Express server receives the payload and mathematically verifies the signature against a secure Environment Variable.

Server acknowledges receipt (202 Accepted) to prevent GitHub timeout.

Server fetches the raw code diff via GitHub's API.

Diff is injected into a strict System Prompt and processed by Gemini 2.5 Flash.

AI response is packaged and POSTed back to the GitHub PR Issues endpoint.

💻 Local Development Setup

Prerequisites

Node.js installed

A GitHub Personal Access Token (with repo permissions)

A Google Gemini API Key

Installation

Clone the repository:

git clone https://github.com/your-username/ai-reviewer-backend.git
cd ai-reviewer-backend

Install dependencies:

npm install

Environment Variables:
Create a .env file in the root directory and add the following:

PORT=3000
GITHUB_TOKEN=your_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_SECRET=your_custom_hmac_secret_string

Run the server:

npm start

Local Webhook Testing:
To test locally without exposing your laptop to the public internet, use a tool like Hookdeck to tunnel GitHub webhooks to your localhost:3000/webhook endpoint.

☁️ Cloud Deployment

This microservice is designed to be easily deployed to serverless or PaaS providers like Render, Railway, or Vercel.

Ensure your Build Command is set to npm install.

Ensure your Start Command is set to npm start.

Crucial: Remember to manually inject your Environment Variables into your cloud provider's secure vault, as your .env file should remain git-ignored.
