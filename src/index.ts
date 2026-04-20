import { startScheduler } from "./scheduler";

// Prefissa ogni console.log con timestamp ISO
const _log = console.log.bind(console);
console.log = (...args: unknown[]) => {
  _log(new Date().toISOString().replace("T", " ").slice(0, 19), ...args);
};

startScheduler().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});