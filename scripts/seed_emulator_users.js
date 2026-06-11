// scripts/seed_emulator_users.js
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const initConfig = {};
if (process.env.FIRESTORE_EMULATOR_HOST) initConfig.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'demo-project';

initializeApp(initConfig);
const db = getFirestore();

async function main() {
  const users = [
    { uid: 'u_admin', email: 'admin@local', displayName: 'Admin Club', roles: { admin: true }, isPlayer: false },
    { uid: 'u_sub', email: 'sub@local', displayName: 'Subadmin', roles: { subadmin: true }, isPlayer: false },
    { uid: 'u_user', email: 'user@local', displayName: 'Juan Perez', roles: { user: true }, isPlayer: true, playerProfile: { categories: ['cat_junior'] } }
  ];
  for (const u of users) {
    await db.collection('users').doc(u.uid).set({ ...u, metadata: { createdAt: new Date() } });
    console.log('Seeded', u.uid);
  }
  console.log('Seed complete.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });