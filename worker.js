const SYSTEM_PROMPT = `
Je bent Mikis13 AI Assistant.

Antwoord helder, praktisch en controleerbaar.
Gebruik publieke webbronnen alleen wanneer actuele informatie nodig is.
Verzin geen feiten, resultaten, sleutels of uitgevoerde acties.
Geef bij programmeervragen veilige en complete voorbeelden.
Gebruik geen onion-, dark-web- of illegale bronnen.
`;

const OFFLINE_KNOWLEDGE = [
  {
    terms: ["github", "workflow", "actions"],
    reply:
      "Offline reserve: haal eerst de foutlog op met `gh run view RUN_ID --log-failed`. " +
      "Herhaal tijdelijke netwerkfouten, maar wijzig broncode alleen bij een reproduceerbare fout."
  },
  {
    terms: ["cloudflare", "worker", "deploy"],
    reply:
      "Offline reserve: controleer `node --check worker.js`, `wrangler.toml`, " +
      "CLOUDFLARE_ACCOUNT_ID en CLOUDFLARE_API_TOKEN. Publiceer daarna met `npx wrangler deploy`."
  },
  {
    terms: ["termux", "internet", "verbinding"],
    reply:
      "Offline reserve: zet VPN en Private DNS tijdelijk uit. Test daarna " +
      "`curl -I https://github.com`, `gh auth status` en `pkg update`."
  },
  {
    terms: ["api", "sleutel", "secret"],
    reply:
      "Offline reserve: plaats API-sleutels uitsluitend in GitHub Secrets of Cloudflare Secrets. " +
      "Zet ze nooit in openbare broncode, logs of chatberichten."
  }
];

function headers() {
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "cache-control": "no-store"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: headers()
  });
}

function getLastUserText(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role !== "user") continue;

    if (typeof message.content === "string") {
      return message.content.trim();
    }

    if (Array.isArray(message.content)) {
      const text = message.content
        .map((part) => {
          if (typeof part === "string") return part;
          return part?.text || "";
        })
        .join(" ")
        .trim();

      if (text) return text;
    }
  }

  return "";
}

function offlineReply(prompt) {
  const normalized = prompt.toLowerCase();

  const match = OFFLINE_KNOWLEDGE.find((item) =>
    item.terms.some((term) => normalized.includes(term))
  );

  if (match) return match.reply;

  return (
    "De online AI of internetverbinding is tijdelijk niet beschikbaar. " +
    "Ik werk nu in beperkte offline reservemodus. Deel de exacte foutmelding, " +
    "het uitgevoerde commando en de laatste logregels."
  );
}

async function hashText(text) {
  const input = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function createCacheKey(request, prompt) {
  const hash = await hashText(prompt);
  const url = new URL(request.url);

  url.pathname = `/__mikis13-cache/${hash}`;
  url.search = "";

  return new Request(url.toString(), {
    method: "GET"
  });
}

function extractOutputText(result) {
  if (
    typeof result?.output_text === "string" &&
    result.output_text.trim()
  ) {
    return result.output_text.trim();
  }

  for (const output of result?.output || []) {
    for (const part of output?.content || []) {
      if (
        part?.type === "output_text" &&
        typeof part.text === "string"
      ) {
        return part.text.trim();
      }
    }
  }

  return "";
}

async function callOpenAI(env, messages, useWebSearch) {
  const body = {
    model: env.OPENAI_MODEL || "gpt-5",
    instructions: SYSTEM_PROMPT,
    input: messages,
    store: false
  };

  if (useWebSearch) {
    body.tools = [
      {
        type: "web_search"
      }
    ];
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result?.error?.message ||
          `OpenAI HTTP-fout ${response.status}`
      );
    }

    const reply = extractOutputText(result);

    if (!reply) {
      throw new Error("OpenAI gaf geen leesbaar antwoord.");
    }

    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request, env, context) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: headers()
      });
    }

    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      (
        url.pathname === "/" ||
        url.pathname === "/api/status"
      )
    ) {
      return json({
        name: "Mikis13 AI",
        status: "online",
        onlineAI: Boolean(env.OPENAI_API_KEY),
        webSearch: Boolean(env.OPENAI_API_KEY),
        offlineFallback: true,
        mode: env.OPENAI_API_KEY
          ? "online-met-offline-reserve"
          : "offline-reserve"
      });
    }

    if (
      request.method !== "POST" ||
      !["/chat", "/api/chat"].includes(url.pathname)
    ) {
      return json(
        {
          error: "Route niet gevonden."
        },
        404
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json(
        {
          error: "Ongeldige JSON-invoer."
        },
        400
      );
    }

    const messages = Array.isArray(body?.messages)
      ? body.messages.slice(-12)
      : [];

    const prompt = getLastUserText(messages);

    if (!prompt) {
      return json(
        {
          error: "Een gebruikersbericht is verplicht."
        },
        400
      );
    }

    const cacheKey = await createCacheKey(request, prompt);
    const cache = caches.default;

    if (!env.OPENAI_API_KEY || body.offline === true) {
      const cached = await cache.match(cacheKey);

      if (cached) {
        const cachedData = await cached.json();

        return json({
          ...cachedData,
          mode: "offline-cache"
        });
      }

      return json({
        reply: offlineReply(prompt),
        mode: "offline-lokaal"
      });
    }

    try {
      const useWebSearch = body.online !== false;

      const reply = await callOpenAI(
        env,
        messages,
        useWebSearch
      );

      const result = {
        reply,
        mode: useWebSearch
          ? "online-webzoeking"
          : "online-zonder-webzoeking"
      };

      const cacheResponse = new Response(
        JSON.stringify(result),
        {
          headers: {
            "content-type":
              "application/json; charset=utf-8",
            "cache-control":
              "public, max-age=86400"
          }
        }
      );

      context.waitUntil(
        cache.put(cacheKey, cacheResponse)
      );

      return json(result);
    } catch (error) {
      console.error(
        "Online AI mislukt:",
        error?.message || error
      );

      const cached = await cache.match(cacheKey);

      if (cached) {
        const cachedData = await cached.json();

        return json({
          ...cachedData,
          mode: "offline-cache-na-fout",
          warning:
            "De online AI was tijdelijk niet bereikbaar."
        });
      }

      return json({
        reply: offlineReply(prompt),
        mode: "offline-lokaal-na-fout",
        warning:
          "De online AI of webzoeking was tijdelijk niet bereikbaar."
      });
    }
  }
};
