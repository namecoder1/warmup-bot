import Imap from "imap";
import { simpleParser } from "mailparser";
import { config } from "../config";
import type { EmailMessage } from "../types";

const FOLDERS_TO_CHECK = ["INBOX", "Security", "Support"];

function searchFolder(imap: Imap, folder: string, since: Date): Promise<EmailMessage[]> {
  return new Promise((resolve) => {
    imap.openBox(folder, false, (err) => {
      if (err) {
        console.log(`[IMAP] Cartella "${folder}" non trovata, skip.`);
        return resolve([]);
      }

      const criteria = config.skipAndCheck
        ? ["UNDELETED", ["SINCE", since]]
        : ["UNSEEN", "UNDELETED", ["SINCE", since]];

      imap.search(criteria, (err, results) => {
        if (err || !results.length) return resolve([]);

        const messages: EmailMessage[] = [];
        const fetch = imap.fetch(results, { bodies: "" });
        const parsePromises: Promise<void>[] = [];

        fetch.on("message", (msg) => {
          msg.on("body", (stream: NodeJS.ReadableStream) => {
            const p = simpleParser(stream as unknown as Parameters<typeof simpleParser>[0])
              .then((parsed) => {
                const toField = parsed.to;
                const toText = Array.isArray(toField)
                  ? toField.map((a) => a.text).join(", ")
                  : toField?.text ?? "";
                messages.push({
                  from: parsed.from?.text ?? "",
                  to: toText,
                  subject: parsed.subject ?? "",
                  body: parsed.text ?? "",
                  messageId: parsed.messageId,
                });
              })
              .catch(() => {});
            parsePromises.push(p);
          });
        });

        fetch.once("end", () => {
          Promise.all(parsePromises).then(() => {
            imap.addFlags(results, "\\Seen", () => resolve(messages));
          });
        });
      });
    });
  });
}

export function fetchUnreadEmails(): Promise<EmailMessage[]> {
  if (config.dryRun) {
    console.log("[DRY-RUN IMAP] Simulo 1 email non letta in inbox Zoho.");
    return Promise.resolve([
      {
        from: "cliente.test@gmail.com",
        to: "support@smartables.it",
        subject: "Problema con le prenotazioni",
        body: "Salve, non riesco ad accedere alla dashboard. Potete aiutarmi?",
        messageId: "<dry-run-test-id@test>",
      },
    ]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.zoho.user,
      password: config.zoho.password,
      host: config.zoho.imap.host,
      port: config.zoho.imap.port,
      tls: config.zoho.imap.tls,
    });

    imap.once("ready", async () => {
      try {
        const results: EmailMessage[] = [];
        for (const folder of FOLDERS_TO_CHECK) {
          const msgs = await searchFolder(imap, folder, today);
          console.log(`[IMAP] Cartella "${folder}": ${msgs.length} email trovate.`);
          results.push(...msgs);
        }
        imap.end();
        resolve(results);
      } catch (err) {
        reject(err);
      }
    });

    imap.once("error", reject);
    imap.connect();
  });
}
