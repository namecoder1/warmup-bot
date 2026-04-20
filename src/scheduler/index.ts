import { config } from "../config";
import { sendFromGmail } from "../gmail/smtp";
import { fetchUnreadEmails } from "../zoho/imap";
import { sendFromZoho } from "../zoho/smtp";
import { generateInboundEmail, generateReply } from "../ai/generate";
import { hasReplied, markReplied } from "../db";

function randomDelay(minMin: number, maxMin: number): number {
  return (Math.random() * (maxMin - minMin) + minMin) * 60 * 1000;
}

function msUntilWindowOpens(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  // Se siamo già oltre le 08:00 di oggi, punta alle 08:00 di domani
  if (now.getHours() >= 8) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function sendWarmupEmails(): Promise<void> {
  console.log(`[Scheduler] Invio mail da ${config.gmailAccounts.length} account verso ${config.zohoAliases.length} alias...`);

  for (const alias of config.zohoAliases) {
    const { subject, body } = await generateInboundEmail(alias);
    console.log(`[Scheduler] Email generata per ${alias}: "${subject}"`);

    for (const account of config.gmailAccounts) {
      await sendFromGmail(account, { from: account.email, to: alias, subject, body });

      if (!config.testMode) {
        const delayMs = randomDelay(60, 180);
        console.log(`[Scheduler] Attendo ${Math.round(delayMs / 60000)} min prima della prossima...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
}

async function replyToIncoming(): Promise<void> {
  console.log(`[Scheduler] Controllo inbox Zoho...`);
  const emails = await fetchUnreadEmails();
  console.log(`[Scheduler] ${emails.length} email trovate.`);

  for (const email of emails) {
    // Ignora email inviate dagli alias stessi (evita loop)
    if (config.zohoAliases.some((a) => email.from.includes(a))) {
      console.log(`[Scheduler] Email da alias proprio (${email.from}), skip.`);
      continue;
    }

    const fromAlias = config.zohoAliases.find((a) => email.to.includes(a)) ?? config.zohoAliases[0];
    const msgId = email.messageId ?? email.from + email.subject;

    // Marca PRIMA di inviare — se due istanze girano in parallelo, una sola passa
    const claimed = markReplied(msgId, fromAlias);
    if (!claimed) {
      console.log(`[Scheduler] Già risposto a "${email.subject}" (${fromAlias}), skip.`);
      continue;
    }

    const reply = await generateReply(email.body, fromAlias);
    await sendFromZoho({ ...email, body: reply }, fromAlias);

    if (!config.testMode) {
      const delayMs = randomDelay(10, 30);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function startScheduler(): Promise<void> {
  const flags = [config.testMode && "[TEST MODE]", config.dryRun && "[DRY RUN]"].filter(Boolean).join(" ");
  console.log(`[Scheduler] Avviato. ${flags}`);

  while (true) {
    const hour = new Date().getHours();
    const inWindow = hour >= 8 && hour < 22;

    if (!config.testMode && !inWindow) {
      const waitMs = msUntilWindowOpens();
      console.log(`[Scheduler] Fuori orario (${hour}:xx). Riprendo alle 08:00 (tra ${Math.round(waitMs / 60000)} min).`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    if (!config.skipAndCheck) {
      await sendWarmupEmails();

      if (config.testMode) {
        console.log("[Scheduler] Attendo 45s che le mail arrivino su Zoho...");
        await new Promise((r) => setTimeout(r, 45000));
      }
    }

    await replyToIncoming();

    if (config.testMode) {
      console.log("[Scheduler] TEST MODE: ciclo completato, uscita.");
      process.exit(0);
    }

    const waitMs = randomDelay(480, 720);
    console.log(`[Scheduler] Ciclo completato. Prossimo tra ${Math.round(waitMs / 60000)} min.`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}
