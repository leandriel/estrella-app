const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./service-account.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function resetMatch() {
  // Buscar el partido La Giralda vs Estrella del Sur (o viceversa)
  const snap = await db.collection('fixtures').get();
  const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const target = matches.find(m =>
    (m.localTeam?.toLowerCase().includes('giralda') || m.awayTeam?.toLowerCase().includes('giralda')) &&
    (m.localTeam?.toLowerCase().includes('estrella') || m.awayTeam?.toLowerCase().includes('estrella'))
  );

  if (!target) {
    console.log('❌ No se encontró el partido. Partidos disponibles:');
    matches.forEach(m => console.log(`  [${m.id}] ${m.localTeam} vs ${m.awayTeam} — ${m.status}`));
    return;
  }

  console.log(`🔍 Encontrado: [${target.id}] ${target.localTeam} vs ${target.awayTeam} (status: ${target.status})`);

  await db.collection('fixtures').doc(target.id).update({
    status: 'pending',
    scoreLocal: FieldValue.delete(),
    scoreAway: FieldValue.delete(),
    liveData: FieldValue.delete(),
  });

  console.log(`✅ Partido reseteado a "pending" sin resultado ni goles.`);
}

resetMatch().catch(err => { console.error(err); process.exit(1); });
