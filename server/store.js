/* ============================================================
 *  Store selector — picks Postgres when DATABASE_URL is set,
 *  otherwise falls back to the zero-config file store.
 * ============================================================ */
const usePg = !!process.env.DATABASE_URL;
const store = usePg ? require("./store-postgres") : require("./store-file");

console.log(`[store] using ${store.kind} store`);

module.exports = store;
