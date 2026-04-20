import nodemailer from "nodemailer";
import { config } from "../config";
import type { GmailAccount, EmailMessage } from "../types";

export async function sendFromGmail(account: GmailAccount, msg: EmailMessage): Promise<void> {
  if (config.dryRun) {
    console.log(`[DRY-RUN Gmail] ${account.email} → ${msg.to} | Oggetto: "${msg.subject}"`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: account.email, pass: account.password },
  });

  await transporter.sendMail({
    from: account.email,
    to: msg.to,
    subject: msg.subject,
    text: msg.body,
  });

  console.log(`[Gmail] Inviata da ${account.email} → ${msg.to}`);
}