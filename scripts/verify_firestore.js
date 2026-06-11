const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

const db = getFirestore();

(async () => {
  const snap = await db.collection('users').get();
  console.log('docs', snap.size);
  snap.forEach(doc => console.log(doc.id, JSON.stringify(doc.data())));
})();
