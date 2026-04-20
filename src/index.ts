import { startScheduler } from "./scheduler";

// Prefissa ogni console.log con timestamp ISO
const _log = console.log.bind(console);
console.log = (...args: unknown[]) => {
  _log(new Date().toLocaleString("sv-SE", { timeZone: process.env.TZ ?? "Europe/Rome" }), ...args);
};

startScheduler().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});