import { getDb } from "../src/db";
import { seed } from "../src/db/seed";

getDb().then(async (db) => {
  await seed(db);
  console.log("Seed klaar: kapsalon-lien, bistro-de-leie, frituur-t-hoekske · login demo@plekk.be / plekk1234");
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
