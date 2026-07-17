const SYSTEM_PROMPT = `
Je bent Mikis13 AI Assistant.

Je antwoordt in helder Nederlands, tenzij de gebruiker een andere taal gebruikt.
Je geeft praktische, concrete en direct uitvoerbare antwoorden.
Bij programmeervragen geef je complete, veilige en werkende voorbeelden.
Je verzint geen resultaten en meldt duidelijk wanneer informatie ontbreekt.
`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET, POST, OPTIONS"
        }
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        name: "Mikis13 AI",
        status: "online",
        aiConfigured: Boolean(env.OPENAI_API_KEY)
      });
    }

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ error: "Route niet gevonden." }, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return json({
        error: "OPENAI_API_KEY is nog niet ingesteld.",
        setupRequired: true
      }, 503);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Ongeldige JSON-invoer." }, 400);
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    if (messages.length === 0) {
      return json({
        error: "messages[] is verplicht."
      }, 400);
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: SYSTEM_PROMPT,
          input: messages
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return json({
        error: "OpenAI-aanvraag mislukt.",
        details: result?.error?.message || "Onbekende OpenAI-fout."
      }, response.status);
    }

    const reply =
      result.output_text ||
      result.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text ||
      "De AI gaf geen leesbaar antwoord.";

    return json({ reply });
  }
};
