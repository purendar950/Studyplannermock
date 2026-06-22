/* Reseed the active store: `npm run seed` */
const store = require("./store");
(async () => {
  await store.init();
  await store.reseed();
  console.log("Reseed complete.");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
