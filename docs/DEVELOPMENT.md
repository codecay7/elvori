# Elvori Development

## Development order

1. Data model
2. Backend contracts
3. Authentication
4. Authorization
5. Compiler sandbox
6. Frontend
7. AI providers
8. AI document agent
9. PDF processing
10. Security audit
11. Deployment

## Security

Secrets belong only in environment variables or a secrets manager.

Never commit:

- API keys
- Supabase service-role keys
- Encryption keys
- Compiler tokens
- OAuth secrets
- Database passwords

`.env.example` contains names only.
