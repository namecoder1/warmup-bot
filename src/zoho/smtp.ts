import nodemailer from "nodemailer";
import { config } from "../config";
import type { EmailMessage } from "../types";

const transporter = nodemailer.createTransport({
  host: config.zoho.smtp.host,
  port: config.zoho.smtp.port,
  secure: config.zoho.smtp.secure,
  auth: {
    user: config.zoho.user,
    pass: config.zoho.password,
  },
});

export async function sendFromZoho(msg: EmailMessage, fromAlias: string): Promise<void> {
  if (config.dryRun) {
    console.log(`[DRY-RUN Zoho] ${fromAlias} → ${msg.from} | Oggetto: "Re: ${msg.subject}"`);
    return;
  }

  await transporter.sendMail({
    from: `Smartables <${fromAlias}>`,
    to: msg.from,
    subject: `Re: ${msg.subject}`,
    text: msg.body,
    inReplyTo: msg.messageId,
  });

  console.log(`[Zoho] Risposta inviata da ${fromAlias} → ${msg.from}`);
}