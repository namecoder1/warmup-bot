export interface GmailAccount {
  email: string;
  password: string;
}

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
  messageId?: string;
}