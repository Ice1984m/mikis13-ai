const INTEGRATIONS = [
  {
    id: "google-workspace",
    name: "Google Workspace",
    services: ["Gmail", "Drive", "Docs", "Sheets", "Calendar"],
    auth: "Google OAuth 2.0",
    scopes: ["gmail.readonly", "drive.metadata.readonly", "documents.readonly", "spreadsheets.readonly", "calendar.readonly"],
    status: "requires-credentials"
  },
  {
    id: "google-cloud",
    name: "Google Cloud",
    services: ["Cloud Resource Manager", "Cloud Run", "Cloud Storage", "Cloud Logging", "Cloud Build", "IAM"],
    auth: "Google OAuth 2.0 / workload identity",
    scopes: ["cloud-platform"],
    status: "requires-credentials"
  },
  {
    id: "google-play-console",
    name: "Google Play Console",
    services: ["Android Publisher API", "internal testing", "closed testing", "open testing", "production releases"],
    auth: "Google service account with Play Console permissions",
    scopes: ["androidpublisher"],
    status: "requires-credentials",
    approvalRequired: true
  },
  {
    id: "android-developer",
    name: "Android Developer",
    services: ["Android SDK", "Gradle", "Android Studio", "APK/AAB builds", "lint", "unit tests", "signing"],
    auth: "GitHub Actions build environment",
    status: "build-workflow-present",
    approvalRequired: true
  }
];

export function getIntegrationStatus(env = {}) {
  return INTEGRATIONS.map((item) => {
    const configured = item.id === "android-developer"
      ? true
      : Boolean(
          env.GOOGLE_OAUTH_CLIENT_ID &&
          env.GOOGLE_OAUTH_CLIENT_SECRET &&
          env.GOOGLE_OAUTH_REDIRECT_URI &&
          env.GOOGLE_TOKEN_STORE
        );

    return {
      ...item,
      configured,
      status: configured ? "credentials-present" : item.status
    };
  });
}
