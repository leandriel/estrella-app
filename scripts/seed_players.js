const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./service-account.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const BASE_PERMISSIONS = {
  createSubadmin: false, createUser: false, modifyUser: false,
  createFixture: false, modifyFixture: false, deleteFixture: false,
  startLiveMatch: false, modifyLiveScore: false,
  createNews: false, modifyNews: false, deleteNews: false,
  createCategory: false, modifyCategory: false, deleteCategory: false,
  addPlayerToCategory: false,
  viewFixtures: true, viewLiveMatches: true, viewNews: true, viewPayments: true,
};

// 9 grupos → 99 jugadores en total
// Cada par futsal+campo del mismo nivel comparte el mismo plantel
const GROUPS = [
  {
    prefix: 'p-af1',
    cats: ['adeful-primera-futsal', 'adeful-primera-campo'],
    players: [
      ['Sebastián', 'García'],    ['Federico', 'Rodríguez'],
      ['Lucas',     'González'],  ['Matías',   'Fernández'],
      ['Ezequiel',  'López'],     ['Diego',    'Martínez'],
      ['Agustín',   'Díaz'],      ['Rodrigo',  'Sánchez'],
      ['Pablo',     'Romero'],    ['Cristian', 'Pérez'],
      ['Gonzalo',   'Torres'],
    ],
  },
  {
    prefix: 'p-apar',
    cats: ['adeful-paralelo-futsal'],
    players: [
      ['Franco',    'Silva'],     ['Leandro',  'Herrera'],
      ['Emanuel',   'Castro'],    ['Ramiro',   'Flores'],
      ['Brian',     'Medina'],    ['Kevin',    'Vargas'],
      ['Nicolás',   'Pereyra'],   ['Facundo',  'Ibáñez'],
      ['Santiago',  'Giménez'],   ['Andrés',   'Acosta'],
      ['Martín',    'Vega'],
    ],
  },
  {
    prefix: 'p-as16',
    cats: ['adeful-sub16-futsal', 'adeful-sub16-campo'],
    players: [
      ['Lautaro',   'Morales'],   ['Thiago',   'Ruiz'],
      ['Nahuel',    'Suárez'],    ['Alan',     'Ojeda'],
      ['Tomás',     'Ríos'],      ['Joaquín',  'Muñoz'],
      ['Emiliano',  'Álvarez'],   ['Damián',   'Gutiérrez'],
      ['Leonardo',  'Medina'],    ['Maximiliano','Romero'],
      ['Bruno',     'Salinas'],
    ],
  },
  {
    prefix: 'p-a2016',
    cats: ['adeful-2016-futsal'],
    players: [
      ['Valentino', 'González'],  ['Tobías',   'López'],
      ['Santino',   'García'],    ['Felipe',   'Rodríguez'],
      ['Mateo',     'Fernández'], ['Bautista', 'Díaz'],
      ['Benjamín',  'Sánchez'],   ['Ignacio',  'Martínez'],
      ['Máximo',    'Torres'],    ['Lautaro',  'Herrera'],
      ['Thiago',    'Flores'],
    ],
  },
  {
    prefix: 'p-lf1',
    cats: ['lifuba-primera-futsal', 'lifuba-primera-campo'],
    players: [
      ['Hernán',    'Blanco'],    ['Marcos',   'Aguilar'],
      ['Javier',    'Vera'],      ['Óscar',    'Méndez'],
      ['Roberto',   'Núñez'],     ['Carlos',   'Ponce'],
      ['Adrián',    'Ramos'],     ['Eduardo',  'Vidal'],
      ['Antonio',   'Luna'],      ['Miguel',   'Correa'],
      ['Jorge',     'Espinoza'],
    ],
  },
  {
    prefix: 'p-lf3',
    cats: ['lifuba-tercera-futsal', 'lifuba-tercera-campo'],
    players: [
      ['Claudio',   'Molina'],    ['Daniel',   'Ortega'],
      ['Ricardo',   'Rojas'],     ['Hugo',     'Campos'],
      ['Sergio',    'Cardozo'],   ['Gustavo',  'Benítez'],
      ['Ariel',     'Rivero'],    ['Walter',   'Godoy'],
      ['Claudio',   'Sosa'],      ['Rubén',    'Barrios'],
      ['Marcelo',   'Reyes'],
    ],
  },
  {
    prefix: 'p-lf4',
    cats: ['lifuba-cuarta-futsal', 'lifuba-cuarta-campo'],
    players: [
      ['Rodrigo',   'Cáceres'],   ['Miguel',   'Zamora'],
      ['Hugo',      'Villalba'],  ['Fernando', 'Cabrera'],
      ['Néstor',    'Delgado'],   ['Luis',     'Arce'],
      ['Ramón',     'Figueroa'],  ['Jorge',    'Montoya'],
      ['Omar',      'Bravo'],     ['Eduardo',  'Paredes'],
      ['Carlos',    'Ibarra'],
    ],
  },
  {
    prefix: 'p-lf5',
    cats: ['lifuba-quinta-futsal', 'lifuba-quinta-campo'],
    players: [
      ['Pablo',     'Palma'],     ['Javier',   'Tapia'],
      ['Luis',      'Chávez'],    ['Carlos',   'Macías'],
      ['Enrique',   'Quispe'],    ['Manuel',   'Rosales'],
      ['Antonio',   'Pizarro'],   ['Julio',    'Castillo'],
      ['Mario',     'Fuentes'],   ['Pedro',    'Vergara'],
      ['Sergio',    'Quiroga'],
    ],
  },
  {
    prefix: 'p-lf6',
    cats: ['lifuba-sexta-futsal', 'lifuba-sexta-campo'],
    players: [
      ['Darío',     'Cano'],      ['Fabián',   'Romano'],
      ['Alejandro', 'Peralta'],   ['Marcos',   'Soria'],
      ['Osvaldo',   'Garay'],     ['Raúl',     'Meza'],
      ['Víctor',    'Palacios'],  ['Nelson',   'Mora'],
      ['Omar',      'Tello'],     ['Ricardo',  'Alva'],
      ['Sergio',    'Delgadillo'],
    ],
  },
];

async function seed() {
  let created = 0;
  for (const group of GROUPS) {
    for (let i = 0; i < group.players.length; i++) {
      const [name, surname] = group.players[i];
      const id = `${group.prefix}-${String(i + 1).padStart(2, '0')}`;
      const displayName = `${name} ${surname}`;
      const doc = {
        email: `${id}@estrella.local`,
        name,
        surname,
        displayName,
        isPlayer: true,
        roles: { user: true },
        permissions: BASE_PERMISSIONS,
        playerProfile: { categories: group.cats },
      };
      await db.collection('users').doc(id).set(doc);
      console.log(`  ✓ ${displayName} → [${group.cats.join(', ')}]`);
      created++;
    }
    console.log(`── Grupo ${group.prefix} completado (${group.players.length} jugadores)\n`);
  }
  console.log(`\n✅ ${created} jugadores creados en total.`);
}

seed().catch(err => { console.error(err); process.exit(1); });
