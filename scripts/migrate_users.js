// scripts/migrate_users.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Inicialización segura: soporta Emulator (sin credenciales) y producción
const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const initConfig = {};
if (useEmulator) {
  initConfig.projectId = process.env.GOOGLE_CLOUD_PROJECT || "demo-project";
} else if (applicationDefault) {
  initConfig.credential = applicationDefault();
}
initializeApp(initConfig);

const db = getFirestore();
const BATCH_SIZE = 500;
const DRY_RUN = (process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true');

if (DRY_RUN) console.log('Running in DRY_RUN mode — no writes will be performed.');

async function transform(docData) {
  // Transformación para migrar el campo antiguo `role` a `roles` y `permissions`.
  const { role, roles: rawRoles, permissions: rawPermissions, ...rest } = docData;
  const roles = typeof rawRoles === 'object' && rawRoles !== null ? { ...rawRoles } : {};

  if (typeof rawRoles === 'string' && rawRoles.trim()) {
    roles[rawRoles.trim()] = true;
  }
  if (typeof role === 'string' && role.trim()) {
    roles[role.trim()] = true;
  }

  const permissions = {
    createSubadmin: false,
    createUser: false,
    modifyUser: false,
    createFixture: false,
    modifyFixture: false,
    deleteFixture: false,
    startLiveMatch: false,
    modifyLiveScore: false,
    createNews: false,
    modifyNews: false,
    deleteNews: false,
    createCategory: false,
    modifyCategory: false,
    deleteCategory: false,
    addPlayerToCategory: false,
    viewFixtures: false,
    viewLiveMatches: false,
    viewNews: false,
    viewPayments: false,
    ...((typeof rawPermissions === 'object' && rawPermissions !== null) ? rawPermissions : {})
  };

  if (roles.admin) {
    permissions.createSubadmin = true;
    permissions.createUser = true;
    permissions.modifyUser = true;
    permissions.createFixture = true;
    permissions.modifyFixture = true;
    permissions.deleteFixture = true;
    permissions.startLiveMatch = true;
    permissions.modifyLiveScore = true;
    permissions.createNews = true;
    permissions.modifyNews = true;
    permissions.deleteNews = true;
    permissions.createCategory = true;
    permissions.modifyCategory = true;
    permissions.deleteCategory = true;
    permissions.addPlayerToCategory = true;
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  if (roles.subadmin) {
    permissions.modifyFixture = true;
    permissions.deleteFixture = true;
    permissions.startLiveMatch = true;
    permissions.modifyLiveScore = true;
    permissions.createNews = true;
    permissions.modifyNews = true;
    permissions.deleteNews = true;
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  if (roles.user) {
    permissions.viewFixtures = true;
    permissions.viewLiveMatches = true;
    permissions.viewNews = true;
    permissions.viewPayments = true;
  }

  return {
    ...rest,
    role: FieldValue.delete(),
    roles,
    permissions,
    isPlayer: !!docData.isPlayer,
    metadata: {
      ...(docData.metadata || {}),
      schemaVersion: 1,
      updatedAt: FieldValue.serverTimestamp()
    }
  };
}

async function updateBatch(docs) {
  if (DRY_RUN) {
    console.log(`DRY_RUN: would update ${docs.length} documents in this batch:`);
    docs.forEach(d => {
      console.log('-', d.ref.path);
      console.log('  -> newData preview:', JSON.stringify(d._newData, null, 2).split('\n').slice(0,6).join('\n'));
    });
    return;
  }

  const batch = db.batch();
  docs.forEach(d => {
    const newData = d._newData;
    batch.set(d.ref, newData, { merge: true });
  });
  await batch.commit();
}

async function run() {
  let last = null;
  let processedCount = 0;
  while (true) {
    let q = db.collection("users").orderBy("__name__").limit(BATCH_SIZE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    const docs = [];
    for (const doc of snap.docs) {
      const before = doc.data();
      const after = await transform(before);
      docs.push({ ref: doc.ref, _newData: after });
    }

    await updateBatch(docs);
    processedCount += docs.length;
    last = snap.docs[snap.docs.length - 1];
    console.log("Procesados hasta:", last.id);
    if (snap.size < BATCH_SIZE) break;
  }
  console.log(`Migración finalizada. Procesados ${processedCount} documentos${DRY_RUN ? ' (DRY_RUN, no se realizaron escrituras)' : ''}.`);
}

run().catch(err => { console.error(err); process.exit(1); });