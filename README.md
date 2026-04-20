# Contesto progetto: Email Warm-up Bot per Smartables

## Cosa stiamo costruendo
Un server TypeScript che gira 24/7 su un **Raspberry Pi 5 (16GB)** il cui scopo è aumentare la
**reputazione dei domini email** degli alias `security@smartables.it` e `support@smartables.it`,
entrambi creati su **Zoho Mail** (piano Mail Lite, 10€/anno).

Il problema è che questi alias sono appena stati creati e Gmail li classifica in spam nonostante
SPF, DKIM e DMARC siano tutti configurati correttamente. Il warm-up serve a costruire storico e
reputazione simulando conversazioni reali.

## Come funziona
1. **4 account Gmail** (con 2FA e App Password attiva) inviano mail scritte da OpenAI a
   `security@smartables.it` o `support@smartables.it` tramite SMTP Gmail.
2. Il bot legge l'inbox Zoho via **IMAP** e trova le mail non lette.
3. Genera una risposta contestuale via **OpenAI GPT-4o-mini**.
4. Risponde via **SMTP Zoho** usando l'alias corretto (`security@` o `support@`).
5. Il ciclo si ripete 2–3 volte al giorno per alias, con delay casuali tra le mail per sembrare
   umano. Opera solo tra le 08:00 e le 22:00.

## Stack tecnico
- **TypeScript** con `tsx` per esecuzione diretta
- **nodemailer** per SMTP (sia Gmail che Zoho)
- **imap + mailparser** per leggere inbox Zoho
- **openai** SDK per generare mail e risposte
- **dotenv** per le variabili d'ambiente
- **PM2** per tenerlo attivo 24/7 sul Raspberry Pi


## Variabili d'ambiente e dove si trovano

| Variabile | Dove si trova |
|---|---|
| `ZOHO_USER` | È `info@smartables.it` (account principale Zoho) |
| `ZOHO_APP_PASSWORD` | **Già creata** → Zoho Mail → Settings → Security → App Passwords → nome "Mailer Server Raspberry" |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `GMAIL_ACCOUNTS` | Per **ognuno dei 4 account Gmail**: Gmail → Account Google → Sicurezza → attiva 2FA → App Password → seleziona "Mail" → copia la password generata. Formato nel `.env`: `email1@gmail.com:apppass1,email2@gmail.com:apppass2,...` |
| `ZOHO_ALIASES` | Sono `security@smartables.it,support@smartables.it` (già creati in Zoho Admin Console) |
| `MAILS_PER_DAY` | Numero intero, default `2` |

## Configurazione Zoho già fatta
- IMAP abilitato: `imappro.zoho.eu:993 SSL`
- SMTP abilitato: `smtppro.zoho.eu:465 SSL`
- Alias `security@smartables.it` e `support@smartables.it` aggiunti all'utente principale in Admin Console
- DKIM selector `zmail._domainkey` verificato e presente nel DNS GoDaddy
- SPF Zoho (`v=spf1 include:zohomail.eu ~all`) presente nel DNS
- DMARC (`p=quarantine`) presente nel DNS
- BIMI record (`default._bimi`) presente con `https://smartables.it/logo.svg`

## Contesto Smartables
Smartables è un SaaS B2B per ristoranti italiani che gestisce prenotazioni e recupero tavoli via
WhatsApp. Stack principale: Next.js 16, Supabase, Telnyx, Resend, Stripe. Questo bot è un
progetto separato e temporaneo (max 1 mese) che non fa parte del prodotto principale.

## Note importanti per Claude
- Le mail generate da AI devono sembrare reali: clienti che chiedono informazioni su sicurezza
  account o supporto tecnico su una piattaforma SaaS per ristoranti.
- I delay tra le mail devono essere casuali e variabili (non fissi) per non sembrare automatizzati.
- Il bot opera solo in orario diurno (08:00–22:00) per simulare comportamento umano.
- La **Zoho App Password** è già stata creata e serve al bot per IMAP (leggere inbox) e SMTP
  (rispondere dagli alias). Va messa in `ZOHO_APP_PASSWORD`.
- La **Gmail App Password** va creata su **ognuno dei 4 account Gmail** separatamente (richiede
  2FA attiva su ogni account Google). Serve al bot per inviare le mail false via SMTP Gmail.
- Zoho SMTP per gli alias: il campo `from` deve usare l'alias corretto (`security@` o `support@`),
  non sempre `info@`.# warmup-bot
