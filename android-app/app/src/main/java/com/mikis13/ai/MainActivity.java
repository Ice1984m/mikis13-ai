package com.mikis13.ai;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {

    private static final String APP_URL = "https://mikis13-ai.ice1984m.workers.dev";

    private WebView webView;
    private ProgressBar progressBar;
    private TextView errorMessage;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        progressBar = new ProgressBar(
            this,
            null,
            android.R.attr.progressBarStyleHorizontal
        );
        progressBar.setMax(100);

        errorMessage = new TextView(this);
        errorMessage.setPadding(32, 32, 32, 32);
        errorMessage.setText(
            "Mikis13 AI kan momenteel niet worden geladen. " +
            "Controleer je internetverbinding en probeer opnieuw."
        );
        errorMessage.setVisibility(View.GONE);

        webView = new WebView(this);

        root.addView(
            progressBar,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        );

        root.addView(
            errorMessage,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        );

        root.addView(
            webView,
            new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        );

        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        webView.addJavascriptInterface(new TermuxBridge(), "AndroidTermux");

        settings.setUserAgentString(
            settings.getUserAgentString() + " Mikis13AI-Android/1.1"
        );

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progress) {
                progressBar.setProgress(progress);
                progressBar.setVisibility(
                    progress >= 100 ? View.GONE : View.VISIBLE
                );
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(
                WebView view,
                String url,
                Bitmap favicon
            ) {
                errorMessage.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(
                WebView view,
                WebResourceRequest request,
                WebResourceError error
            ) {
                if (request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    webView.setVisibility(View.GONE);
                    errorMessage.setText(
                        "Mikis13 AI is tijdelijk niet bereikbaar. " +
                        "Tik hier om opnieuw te proberen."
                    );

                    errorMessage.setOnClickListener(v -> {
                        errorMessage.setVisibility(View.GONE);
                        webView.setVisibility(View.VISIBLE);
                        progressBar.setVisibility(View.VISIBLE);
                        webView.reload();
                    });

                    errorMessage.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(
                WebView view,
                WebResourceRequest request
            ) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if ("https".equalsIgnoreCase(scheme) ||
                    "http".equalsIgnoreCase(scheme)) {
                    return false;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                }

                return true;
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(
                String url,
                String userAgent,
                String contentDisposition,
                String mimeType,
                long contentLength
            ) {
                try {
                    startActivity(
                        new Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    );
                } catch (Exception ignored) {
                }
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }


    /**
     * Fixed allow-list bridge. It never accepts shell text or arbitrary paths from JavaScript.
     * Termux must be installed and "Allow external apps" enabled by the device owner.
     */
    private final class TermuxBridge {
        @JavascriptInterface
        public void runTask(String taskId) {
            final String command;
            final String[] args;
            final String title;
            switch (taskId) {
                case "device":
                    command = "/data/data/com.termux/files/usr/bin/termux-info";
                    args = new String[]{};
                    title = "Toestelinfo";
                    break;
                case "identity":
                    command = "/data/data/com.termux/files/usr/bin/id";
                    args = new String[]{};
                    title = "Gebruikers-ID";
                    break;
                case "storage":
                    command = "/data/data/com.termux/files/usr/bin/df";
                    args = new String[]{"-h"};
                    title = "Opslagstatus";
                    break;
                case "network":
                    command = "/data/data/com.termux/files/usr/bin/uname";
                    args = new String[]{"-a"};
                    title = "Systeeminfo";
                    break;
                default:
                    runOnUiThread(() -> Toast.makeText(
                        MainActivity.this,
                        "Deze opdracht staat niet op de toegestane lijst.",
                        Toast.LENGTH_LONG
                    ).show());
                    return;
            }

            runOnUiThread(() -> new AlertDialog.Builder(MainActivity.this)
                .setTitle("Termux-opdracht goedkeuren?")
                .setMessage(title + "\\n\\nVaste opdracht: " + command
                    + "\\n\\nDeze opdracht opent Termux op dit toestel. Er wordt geen vrije shelltekst uitgevoerd.")
                .setNegativeButton("Annuleren", (dialog, which) -> dialog.dismiss())
                .setPositiveButton("Goedkeuren en uitvoeren", (dialog, which) -> {
                    try {
                        Intent intent = new Intent("com.termux.RUN_COMMAND");
                        intent.setPackage("com.termux");
                        intent.putExtra("com.termux.RUN_COMMAND_PATH", command);
                        intent.putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args);
                        intent.putExtra("com.termux.RUN_COMMAND_WORKDIR",
                            "/data/data/com.termux/files/home");
                        intent.putExtra("com.termux.RUN_COMMAND_BACKGROUND", false);
                        startService(intent);
                        Toast.makeText(MainActivity.this,
                            "Opdracht doorgestuurd naar Termux.",
                            Toast.LENGTH_LONG).show();
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this,
                            "Termux niet beschikbaar. Installeer Termux en schakel externe opdrachten in.",
                            Toast.LENGTH_LONG).show();
                    }
                })
                .show());
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.clearHistory();
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }

        super.onDestroy();
    }
}
