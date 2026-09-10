import { getDb } from "../src/db";
import { seed } from "../src/db/seed";

getDb().then(async (db) => {
  await seed(db);
  console.log("Seed klaar: kapsalon-lien, bistro-de-leie, frituur-t-hoekske. Demo-login via /api/demo/login; beheerder via ADMIN_EMAIL + ADMIN_PASSWORD.");
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
