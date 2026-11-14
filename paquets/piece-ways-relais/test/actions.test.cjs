// Contrôle de la pièce compilée, telle qu'Activepieces la chargera : on lit
// dist/ (le paquet publié), pas les sources.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { waysRelais } = require(path.join(__dirname, '..', 'dist', 'src', 'index.js'));

function action(nom) {
  const a = waysRelais.getAction(nom);
  assert.ok(a, `action absente : ${nom}`);
  return a;
}
const lancer = (nom, propsValue) => action(nom).run({ propsValue });

test('la pièce expose ses trois actions, sans déclencheur ni authentification', () => {
  assert.equal(waysRelais.displayName, 'WAYS Relais');
  assert.deepEqual(Object.keys(waysRelais.actions()).sort(), [
    'check_public_holiday',
    'format_cfa_amount',
    'format_phone_number',
  ]);
  assert.deepEqual(Object.keys(waysRelais.triggers()), []);
});

test('numéro : forme WhatsApp et E.164', async () => {
  const s = await lancer('format_phone_number', { country: 'CI', phone_number: '07 00 00 00 00' });
  assert.equal(s.international, '2250700000000');
  assert.equal(s.e164, '+2250700000000');
});

test('CAS FAUTIF : numéro sans pays, l’étape échoue avec le code', async () => {
  await assert.rejects(lancer('format_phone_number', { country: '', phone_number: '0700000000' }), /\[PAYS_MANQUANT\]/);
});

test('montant : chiffres et lettres', async () => {
  const s = await lancer('format_cfa_amount', { amount: '1.500.000' });
  assert.equal(s.words, 'un million cinq cent mille francs CFA');
});

test('CAS FAUTIF : montant à virgule refusé', async () => {
  await assert.rejects(lancer('format_cfa_amount', { amount: '2500,75' }), /\[MONTANT_A_VIRGULE\]/);
});

test('jour : veille de Noël 2026, prochain jour ouvré le lundi 28', async () => {
  const s = await lancer('check_public_holiday', { date: '2026-12-24' });
  assert.equal(s.nextWorkingDay.date, '2026-12-28');
});

test('jour : une annonce avec sa source rend la date fériée', async () => {
  const s = await lancer('check_public_holiday', {
    date: '2027-05-18',
    announced_days: [{ date: '2027-05-18', name: 'Tabaski (Aïd el-Kébir)', source: 'Communiqué de test' }],
  });
  assert.equal(s.isHoliday, true);
});

test('CAS FAUTIF : annonce sans source refusée', async () => {
  await assert.rejects(
    lancer('check_public_holiday', {
      date: '2027-05-18',
      announced_days: [{ date: '2027-05-18', name: 'Tabaski (Aïd el-Kébir)', source: '' }],
    }),
    /\[AJOUT_SANS_SOURCE\]/,
  );
});
