const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const requestCounters = new Map();

const PAGE = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Mikis13 AI-assistent">
<title>Mikis13 AI</title>
<link rel="manifest" href="/manifest.json">

<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-height: 100vh;
    color: #fff;
    background:
        radial-gradient(circle at 15% 10%, #1e3a8a, transparent 38%),
        radial-gradient(circle at 90% 90%, #581c87, transparent 40%),
        #020617;
    font-family: Arial, Helvetica, sans-serif;
}

header {
    height: 68px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255,255,255,.1);
    background: rgba(2,6,23,.8);
}

.header-inner {
    width: min(950px, calc(100% - 28px));
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

h1 {
    margin: 0;
    font-size: 21px;
}

#status {
    padding: 7px 11px;
    border-radius: 999px;
    color: #86efac;
    background: rgba(34,197,94,.15);
    font-size: 12px;
}

main {
    width: min(950px, calc(100% - 24px));
    height: calc(100vh - 94px);
    margin: 13px auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.11);
    border-radius: 22px;
    background: rgba(15,23,42,.82);
    backdrop-filter: blur(16px);
}

.intro {
    padding: 17px;
    border-bottom: 1px solid rgba(255,255,255,.1);
}

.intro strong {
    display: block;
    margin-bottom: 4px;
}

.intro small {
    color: #94a3b8;
}

#messages {
    flex: 1;
    overflow-y: auto;
    padding: 17px;
}

.row {
    display: flex;
    margin-bottom: 13px;
}

.row.user {
    justify-content: flex-end;
}

.bubble {
    max-width: 84%;
    padding: 12px 15px;
    border-radius: 16px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.assistant .bubble {
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.1);
}

.user .bubble {
    background: #2563eb;
}

#error {
    display: none;
    margin: 0 14px 10px;
    padding: 11px;
    border-radius: 12px;
    color: #fecaca;
    background: rgba(239,68,68,.16);
}

form {
    display: flex;
    gap: 9px;
    padding: 13px;
    border-top: 1px solid rgba(255,255,255,.1);
}

textarea {
    flex: 1;
    min-height: 50px;
    max-height: 130px;
    resize: none;
    padding: 13px;
    border: 1px solid rgba(255,255,255,.14);
    border-radius: 14px;
    outline: none;
    color: white;
    background: rgba(0,0,0,.22);
}

button {
    width: 54px;
    border: 0;
    border-radius: 14px;
    color: white;
    background: #2563eb;
    font-size: 20px;
}

button:disabled {
    opacity: .45;
}

@media (max-width: 600px) {
    main {
        height: calc(100vh - 82px);
        width: 100%;
        margin: 7px 0;
        border-radius: 0;
    }

    .bubble {
        max-width: 91%;
    }
}
</style>
</head>

<body>
<header>
    <div class="header-inner">
        <h1>Mikis13 AI</h1>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span id="install-btn" style="display: none; cursor: pointer; padding: 6px 12px; border-radius: 999px; color: #fff; background: #2563eb; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,.2); white-space: nowrap;">📱 Installeer App</span>
            <a href="https://github.com/Ice1984m/mikis13-ai/releases/download/latest/mikis13-ai.apk" style="text-decoration: none; cursor: pointer; padding: 6px 12px; border-radius: 999px; color: #fff; background: #10b981; font-size: 12px; font-weight: bold; border: 1px solid rgba(255,255,255,.2); white-space: nowrap;">🤖 Download APK</a>
            <span id="status">● online</span>
        </div>
    </div>
</header>

<main>
    <div class="intro">
        <strong>Digitale Mikis13-assistent</strong>
        <small>Termux, GitHub, websites, code, muziek en creatieve projecten.</small>
    </div>

    <div id="messages"></div>
    <div id="error"></div>

    <form id="form">
        <textarea
            id="input"
            maxlength="4000"
            placeholder="Typ je bericht..."
            required
        ></textarea>

        <button id="send" type="submit" aria-label="Versturen">➤</button>
    </form>
</main>

<script>
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const errorBox = document.getElementById("error");

const storageKey = "mikis13-ai-history-v1";
let history = [];

try {
    history = JSON.parse(localStorage.getItem(storageKey)) || [];
} catch {
    history = [];
}

function saveHistory() {
    localStorage.setItem(
        storageKey,
        JSON.stringify(history.slice(-16))
    );
}

function addMessage(role, content) {
    const row = document.createElement("div");
    const bubble = document.createElement("div");

    row.className = "row " + role;
    bubble.className = "bubble";
    bubble.textContent = content;

    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;

    return row;
}

if (history.length) {
    for (const item of history) {
        addMessage(item.role, item.content);
    }
} else {
    addMessage(
        "assistant",
        "Hallo! Ik ben Mikis13 AI. Waarmee kan ik je helpen?"
    );
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = input.value.trim();

    if (!message) {
        return;
    }

    errorBox.style.display = "none";

    const previousHistory = history.slice(-8);

    history.push({
        role: "user",
        content: message
    });

    saveHistory();
    addMessage("user", message);

    input.value = "";
    input.disabled = true;
    send.disabled = true;

    const waiting = addMessage(
        "assistant",
        "Mikis13 AI denkt…"
    );

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                history: previousHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "De AI-service gaf een fout."
            );
        }

        waiting.remove();

        history.push({
            role: "assistant",
            content: data.reply
        });

        saveHistory();
        addMessage("assistant", data.reply);
    } catch (error) {
        waiting.remove();
        errorBox.textContent = error.message;
        errorBox.style.display = "block";
    } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
    }
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

input.focus();

// Register Service Worker and PWA install prompt
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
}

let deferredPrompt;
const installBtn = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
        installBtn.style.display = "inline-block";
    }
});

if (installBtn) {
    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) {
            alert("Om deze app te installeren op je startscherm, tik op de 3 puntjes in de browser (of het deel-icoon op iOS) en kies 'Toevoegen aan startscherm' of 'App installeren'.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            installBtn.style.display = "none";
        }
        deferredPrompt = null;
    });
}
</script>
</body>
</html>`;

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "no-store"
        }
    });
}

function clientIp(request) {
    return request.headers.get("CF-Connecting-IP") || "unknown";
}

function allowRequest(ip) {
    const now = Date.now();
    const current = requestCounters.get(ip);

    if (!current || now >= current.resetAt) {
        requestCounters.set(ip, {
            count: 1,
            resetAt: now + WINDOW_MS
        });

        return true;
    }

    if (current.count >= MAX_REQUESTS) {
        return false;
    }

    current.count += 1;
    return true;
}

function cleanHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .slice(-8)
        .map(item => ({
            role: item?.role === "assistant"
                ? "assistant"
                : "user",
            content: String(item?.content || "")
                .trim()
                .slice(0, 2000)
        }))
        .filter(item => item.content);
}

function extractText(data) {
    if (typeof data?.output_text === "string") {
        return data.output_text.trim();
    }

    const output = [];

    for (const item of data?.output || []) {
        for (const content of item?.content || []) {
            if (
                content?.type === "output_text" &&
                typeof content?.text === "string"
            ) {
                output.push(content.text);
            }
        }
    }

    return output.join("\n").trim();
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/") {
            return new Response(PAGE, {
                headers: {
                    "Content-Type": "text/html; charset=UTF-8",
                    "Cache-Control": "no-cache"
                }
            });
        }

        if (
            request.method === "GET" &&
            (url.pathname === "/manifest.json" ||
                url.pathname === "/manifest.webmanifest")
        ) {
            return new Response(
                JSON.stringify({
                    name: "Mikis13 AI",
                    short_name: "Mikis13 AI",
                    description: "Digitale Mikis13 AI-assistent",
                    start_url: "/",
                    display: "standalone",
                    background_color: "#020617",
                    theme_color: "#2563eb",
                    orientation: "portrait",
                    icons: [
                        {
                            src: "https://img.icons8.com/fluent/192/000000/artificial-intelligence.png",
                            sizes: "192x192",
                            type: "image/png"
                        },
                        {
                            src: "https://img.icons8.com/fluent/512/000000/artificial-intelligence.png",
                            sizes: "512x512",
                            type: "image/png"
                        }
                    ]
                }),
                {
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                        "Cache-Control": "public, max-age=3600"
                    }
                }
            );
        }

        if (request.method === "GET" && url.pathname === "/sw.js") {
            return new Response(
                `const CACHE_NAME = "mikis13-ai-cache-v1";
const ASSETS = ["/", "/api/status"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS).catch(() => {})));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});`,
                {
                    headers: {
                        "Content-Type": "application/javascript; charset=UTF-8",
                        "Cache-Control": "public, max-age=3600"
                    }
                }
            );
        }

        if (
            request.method === "GET" &&
            url.pathname === "/api/status"
        ) {
            return json({
                online: true,
                service: "Mikis13 AI"
            });
        }

        if (
            request.method !== "POST" ||
            url.pathname !== "/api/chat"
        ) {
            return json({
                error: "Route niet gevonden."
            }, 404);
        }

        if (!allowRequest(clientIp(request))) {
            return json({
                error: "Te veel berichten. Wacht ongeveer één minuut."
            }, 429);
        }

        if (!env.OPENAI_API_KEY) {
            return json({
                error: "De OpenAI API-key ontbreekt op de server."
            }, 500);
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return json({
                error: "Ongeldig verzoek."
            }, 400);
        }

        const message = String(body?.message || "")
            .trim()
            .slice(0, 4000);

        if (!message) {
            return json({
                error: "Typ eerst een bericht."
            }, 400);
        }

        const input = [
            {
                role: "developer",
                content:
                    "Je bent Mikis13 AI, een behulpzame digitale assistent. " +
                    "Antwoord standaard in duidelijk Nederlands. " +
                    "Help met Termux, GitHub, websites, programmeren, " +
                    "muziek en creatieve projecten. " +
                    "Geef kopieerbare en veilige stappen. " +
                    "Vraag nooit om wachtwoorden, tokens of geheime sleutels. " +
                    "Zeg eerlijk wanneer informatie onzeker is."
            },
            ...cleanHistory(body?.history),
            {
                role: "user",
                content: message
            }
        ];

        let openAIResponse;

        try {
            openAIResponse = await fetch(
                "https://api.openai.com/v1/responses",
                {
                    method: "POST",
                    headers: {
                        "Authorization":
                            `Bearer ${env.OPENAI_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model:
                            env.OPENAI_MODEL || "gpt-5-mini",
                        input,
                        max_output_tokens: 800
                    })
                }
            );
        } catch {
            return json({
                error: "OpenAI kon niet worden bereikt."
            }, 502);
        }

        const result =
            await openAIResponse.json().catch(() => ({}));

        if (!openAIResponse.ok) {
            console.error(
                "OpenAI-fout:",
                openAIResponse.status,
                JSON.stringify(result)
            );

            if (openAIResponse.status === 401) {
                return json({
                    error: "De OpenAI API-key is ongeldig."
                }, 502);
            }

            if (openAIResponse.status === 429) {
                return json({
                    error:
                        "OpenAI-tegoed, facturering of gebruikslimiet bereikt."
                }, 502);
            }

            if (openAIResponse.status === 404) {
                return json({
                    error:
                        "Het ingestelde OpenAI-model is niet beschikbaar."
                }, 502);
            }

            return json({
                error: "OpenAI gaf een serverfout."
            }, 502);
        }

        const reply = extractText(result);

        if (!reply) {
            return json({
                error: "De AI gaf geen leesbaar antwoord."
            }, 502);
        }

        return json({ reply });
    }
};
