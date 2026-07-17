# Security Policy

API-sleutels, tokens en wachtwoorden mogen nooit in broncode, commits,
issues of workflowbestanden worden geplaatst.

Gebruik uitsluitend GitHub Actions Secrets:

- OPENAI_API_KEY
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

Een gelekte sleutel moet onmiddellijk worden ingetrokken en vervangen.
