# Google and Android integration setup

This repository now exposes a read-only integration registry at `GET /api/integrations` and includes it in `GET /api/status`.

## Current state

- Android developer toolchain: existing Android Gradle build workflow is retained. It currently produces a debug APK artifact; it does not create a Play-ready signed AAB.
- Google Workspace: integration plan defined; OAuth consent, client credentials, callback route, and encrypted token storage are not configured.
- Google Cloud: supported service targets and least-privilege direction are documented; no cloud project or IAM identity is provisioned by this code.
- Google Play Console: Android Publisher API release path is documented; no upload or publication is triggered.

The registry deliberately reports integrations as unconfigured until server-side OAuth settings and token storage are provided. A configured flag is not proof that an external account has granted access.

## Google Cloud setup

1. Create or select a Google Cloud project owned by the operator.
2. Configure the OAuth consent screen and publish/test-user policy.
3. Create a Web application OAuth client with an exact HTTPS redirect URI.
4. Enable only the APIs needed for the features being activated: Gmail API, Drive API, Docs API, Sheets API, Calendar API, and Android Publisher API as appropriate.
5. Use separate identities for runtime access and deployment. Grant least-privilege IAM roles; do not grant Owner or Editor for convenience.
6. Store OAuth client secrets and refresh tokens in a managed secret store (for example Google Secret Manager or Cloudflare Secrets plus an encrypted token store). Never commit credentials.

## OAuth security requirements

- Use Authorization Code flow with PKCE where supported, exact redirect URI matching, and state validation.
- Request incremental, least-privilege scopes. Prefer read-only scopes until write operations are explicitly needed.
- Encrypt refresh tokens at rest, restrict access to the server runtime, rotate/revoke credentials, and never return tokens to the browser or Android WebView.
- Add per-user authorization and audit logging before enabling mailbox, file, document, sheet, or calendar operations.
- Do not put service-account JSON, client secrets, API keys, keystore files, or refresh tokens in Git.

## Google Play publication

1. Enable the Google Play Android Developer API in the selected Cloud project.
2. Create a dedicated service account and grant it only the required app-level Play Console permissions.
3. Link that service account in Play Console.
4. Build a release AAB with a protected signing key stored in GitHub Actions secrets or a managed signing service.
5. Upload first to internal testing. Validate install, signing, version code, permissions, privacy disclosures, and Play pre-launch reports.
6. Production rollout must use a protected GitHub environment (for example `play-production`) with required reviewers. A human must approve the final production release.

No public release is performed by this repository change.

## Required secrets and configuration (names only)

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_TOKEN_STORE` (reference to an encrypted server-side store; not the token itself)
- For Play upload: a dedicated service-account credential supplied to the protected release job, plus Android signing material. Never use a developer's personal account password.

## API

- `GET /api/status`: service status plus integration readiness summary.
- `GET /api/integrations`: integration readiness summary.

The API currently does not expose Gmail, Drive, Calendar, Cloud, or Play data operations. Those require a reviewed OAuth callback, token vault, user authorization model, and service-specific endpoints before they can be enabled.
