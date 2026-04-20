import dotenv from "dotenv";
import type { GmailAccount } from "./types";

dotenv.config({ path: ".env.local" });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const config = {
  zoho: {
    user: required("ZOHO_USER"),
    password: required("ZOHO_APP_PASSWORD"),
    imap: { host: "imappro.zoho.eu", port: 993, tls: true },
    smtp: { host: "smtppro.zoho.eu", port: 465, secure: true },
  },
  openai: {
    apiKey: required("OPENAI_API_KEY"),
  },
  gmailAccounts: required("GMAIL_ACCOUNTS")
    .split(",")
    .map((entry) => {
      const [email, password] = entry.split(":");
      return { email, password } as GmailAccount;
    }),
  zohoAliases: required("ZOHO_ALIASES").split(","),
  testMode: process.env.TEST_MODE === "true",
  dryRun: process.env.DRY_RUN === "true",
  skipAndCheck: process.env.SKIP_AND_CHECK === "true",
};