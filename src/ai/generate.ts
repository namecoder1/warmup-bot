import OpenAI from "openai";
import { config } from "../config";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateInboundEmail(targetAlias: string): Promise<{ subject: string; body: string }> {
  const aliasType = targetAlias.includes("security") ? "security" : "support";

  const prompt = aliasType === "security"
    ? "Scrivi una mail professionale breve (max 80 parole) da un cliente che chiede informazioni sulla sicurezza del proprio account o dati su una piattaforma SaaS. Includi oggetto e corpo. Formato: OGGETTO: ...\nCORPO: ..."
    : "Scrivi una mail professionale breve (max 80 parole) da un cliente che ha un problema tecnico o una domanda su come usare una piattaforma SaaS di prenotazioni. Includi oggetto e corpo. Formato: OGGETTO: ...\nCORPO: ...";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.choices[0].message.content ?? "";
  const subjectMatch = text.match(/OGGETTO:\s*(.+)/);
  const bodyMatch = text.match(/CORPO:\s*([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() ?? "Richiesta informazioni",
    body: bodyMatch?.[1]?.trim() ?? text,
  };
}

export async function generateReply(originalBody: string, fromAlias: string): Promise<string> {
  const aliasType = fromAlias.includes("security") ? "sicurezza" : "supporto";

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Sei un agente ${aliasType} di Smartables, una piattaforma SaaS per ristoranti italiani. Rispondi in modo professionale e cordiale a questa mail del cliente (max 100 parole):\n\n${originalBody}`,
      },
    ],
  });

  return res.choices[0].message.content?.trim() ?? "Grazie per averci contattato. Ti risponderemo al più presto.";
}