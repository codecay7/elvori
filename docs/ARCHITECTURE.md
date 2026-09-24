# Elvori Architecture

## Principles

1. Never hard-code secrets.
2. Validate all external input.
3. Authenticate before protected operations.
4. Authorize every project/resource operation.
5. Keep business logic outside route handlers.
6. Keep database access inside repositories.
7. Keep external AI providers behind provider interfaces.
8. Keep LaTeX compilation isolated from the web application.
9. Never execute user LaTeX directly on the host.
10. Keep modules replaceable.

## Request flow

Client
↓
Next.js Route
↓
Authentication
↓
Authorization
↓
Validation
↓
Service
↓
Repository / Provider
↓
Database / AI / Compiler
↓
Validated response

## Future AI architecture

AI Service
↓
Provider Interface
├── OpenAI
├── Gemini
├── OpenRouter
└── Future Providers

The application must never depend directly on one AI provider.

## Future compiler architecture

Web Application
↓
Compiler Service
↓
Queue
↓
Sandboxed Docker Container
↓
TeX Live
↓
PDF
↓
Storage

The compiler must be treated as an untrusted-code execution boundary.
