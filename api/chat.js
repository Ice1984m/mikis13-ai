import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function readSystemPrompt() {
  try {
    const promptPath = path.join(
      process.cwd(),
      "bot",
      "system-prompt.txt"
    );

    return fs.readFileSync(promptPath, "utf8").trim();
  } catch {
    return [
      "Je bent Mikis13 AI Assistant.",
      "Antwoord altijd helder, praktisch en concreet.",
      "Geef bij technische vragen bruikbare stappen en complete code.",
      "Vraag alleen om verduidelijking wanneer dit echt noodzakelijk is.",
      "Gebruik standaard de Nederlandse taal."
    ].join(" ");
  }
}

function normalizeMessages(messages) {
  return messages
    .filter(
      (message) =>
        message &&
        typeof message === "object" &&
        typeof message.content === "string"
    )
    .slice(-30)
    .map((message) => ({
      role: ["user", "assistant", "developer"].includes(message.role)
        ? message.role
        : "user",
      content: message.content.slice(0, 20000),
    }));
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Alleen POST-verzoeken zijn toegestaan.",
    });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is niet ingesteld op de server.",
      });
    }

    const messages = normalizeMessages(req.body?.messages || []);

    if (messages.length === 0) {
      return res.status(400).json({
        error: "Een geldige messages[]-lijst is verplicht.",
      });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions: readSystemPrompt(),
      input: messages,
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return res.status(502).json({
        error: "De AI gaf geen leesbaar antwoord.",
      });
    }

    return res.status(200).json({
      reply,
    });
  } catch (error) {
    console.error("OpenAI API-fout:", error);

    const status =
      Number.isInteger(error?.status) &&
      error.status >= 400 &&
      error.status <= 599
        ? error.status
        : 500;

    return res.status(status).json({
      error: "De AI-aanvraag is mislukt.",
      details:
        process.env.NODE_ENV === "development"
          ? error?.message || "Onbekende fout"
          : undefined,
    });
  }
}
