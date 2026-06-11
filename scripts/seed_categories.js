const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

const categories = [
  { id: 'adeful-primera-futsal', league: 'ADEFUL', surface: 'futsal', displayName: 'Primera futsal', order: 1 },
  { id: 'adeful-paralelo-futsal', league: 'ADEFUL', surface: 'futsal', displayName: 'Paralelo futsal', order: 2 },
  { id: 'adeful-sub16-futsal', league: 'ADEFUL', surface: 'futsal', displayName: 'Sub 16 futsal', order: 3 },
  { id: 'adeful-2016-futsal', league: 'ADEFUL', surface: 'futsal', displayName: 'Categoría 2016 futsal', order: 4 },
  { id: 'adeful-primera-campo', league: 'ADEFUL', surface: 'campo', displayName: 'Primera campo', order: 5 },
  { id: 'adeful-sub16-campo', league: 'ADEFUL', surface: 'campo', displayName: 'Sub 16 campo', order: 6 },
  { id: 'lifuba-primera-futsal', league: 'LIFUBA', surface: 'futsal', displayName: 'Primera futsal', order: 10 },
  { id: 'lifuba-tercera-futsal', league: 'LIFUBA', surface: 'futsal', displayName: 'Tercera futsal', order: 11 },
  { id: 'lifuba-cuarta-futsal', league: 'LIFUBA', surface: 'futsal', displayName: 'Cuarta futsal', order: 12 },
  { id: 'lifuba-quinta-futsal', league: 'LIFUBA', surface: 'futsal', displayName: 'Quinta futsal', order: 13 },
  { id: 'lifuba-sexta-futsal', league: 'LIFUBA', surface: 'futsal', displayName: 'Sexta futsal', order: 14 },
  { id: 'lifuba-primera-campo', league: 'LIFUBA', surface: 'campo', displayName: 'Primera campo', order: 20 },
  { id: 'lifuba-tercera-campo', league: 'LIFUBA', surface: 'campo', displayName: 'Tercera campo', order: 21 },
  { id: 'lifuba-cuarta-campo', league: 'LIFUBA', surface: 'campo', displayName: 'Cuarta campo', order: 22 },
  { id: 'lifuba-quinta-campo', league: 'LIFUBA', surface: 'campo', displayName: 'Quinta campo', order: 23 },
  { id: 'lifuba-sexta-campo', league: 'LIFUBA', surface: 'campo', displayName: 'Sexta campo', order: 24 },
];

async function seed() {
  for (const category of categories) {
    const ref = db.collection('categories').doc(category.id);
    await ref.set(category);
    console.log('Seeded category', category.id);
  }
  console.log('Categories seed complete');
}

seed().catch((error) => {
  console.error('Failed to seed categories:', error);
  process.exit(1);
});
