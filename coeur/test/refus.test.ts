import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numeroInternational, montantFcfa, lireDate, lireAjouts } from '../index.ts'
import type { Refus } from '../refus.ts'

/** Un refus de chaque sorte que le cœur sait produire. */
const CAS: [string, unknown][] = [
  ['pays manquant', numeroInternational('0700000000', undefined)],
  ['pays inconnu', numeroInternational('0700000000', 'FR')],
  ['numéro vide', numeroInternational('', 'CI')],
  ['indicatif contredit', numeroInternational('+221 77 000 00 00', 'CI')],
  ['format faux', numeroInternational('0700', 'CI')],
  ['montant à virgule', montantFcfa('1500,50')],
  ['montant à virgule (nombre)', montantFcfa(12.5)],
  ['montant à point mal groupé', montantFcfa('1500.5')],
  ['montant illisible', montantFcfa('beaucoup')],
  ['montant manquant', montantFcfa('')],
  ['montant négatif', montantFcfa('-5')],
  ['montant trop grand', montantFcfa(1_000_000_000_000)],
  ['date manquante', lireDate('')],
  ['date illisible', lireDate('demain')],
  ['date inexistante', lireDate('2027-02-29')],
  ['année hors calendrier', lireDate('1990-01-01')],
  ['ajouts pas une liste', lireAjouts('2026-05-27')],
  ['ajout à date fausse', lireAjouts([{ date: '2026-04-31', nom: 'Tabaski (Aïd el-Kébir)', source: 'x' }])],
  ['ajout sans nom', lireAjouts([{ date: '2026-05-27', nom: '', source: 'x' }])],
  ['ajout sans source', lireAjouts([{ date: '2026-05-27', nom: 'Tabaski (Aïd el-Kébir)', source: '' }])],
]

/** Un message anglais ne porte ni guillemets français ni lettres accentuées. */
const TRACE_DE_FRANCAIS = /[«»éèêàâùûôîçÉ]/

function verifier(nom: string, r: unknown): void {
  const x = r as Refus
  assert.equal(x.ok, false, `${nom} : accepté à tort`)
  assert.match(x.code, /^[A-Z_]+$/, `${nom} : code absent ou mal formé (${x.code})`)
  assert.ok(x.erreur?.trim(), `${nom} : raison en français absente`)
  assert.ok(x.message?.trim(), `${nom} : message anglais absent`)
  assert.doesNotMatch(x.message, TRACE_DE_FRANCAIS, `${nom} : le message anglais contient du français : ${x.message}`)
}

test('chaque refus porte un code, sa raison en français et son message en anglais', () => {
  for (const [nom, r] of CAS) verifier(nom, r)
})

test('CAS FAUTIF : le contrôle voit un message anglais resté en français', () => {
  const faux = { ok: false, code: 'X', erreur: 'Montant négatif refusé.', message: 'Montant négatif refusé.' }
  assert.throws(() => verifier('faux', faux), /contient du français/)
})

test('CAS FAUTIF : le contrôle voit un refus sans code', () => {
  const faux = { ok: false, erreur: 'Montant manquant.', message: 'Amount is missing.' }
  assert.throws(() => verifier('faux', faux), /code absent/)
})

test('les codes restent stables pour les cas qui décident d\'un flux', () => {
  const code = (r: unknown) => (r as Refus).code
  assert.equal(code(numeroInternational('0700000000', '')), 'PAYS_MANQUANT')
  assert.equal(code(montantFcfa('1500,50')), 'MONTANT_A_VIRGULE')
  assert.equal(code(lireDate('2027-02-29')), 'DATE_INEXISTANTE')
  assert.equal(code(lireAjouts([{ date: '2027-02-29', nom: 'n', source: 's' }])), 'DATE_INEXISTANTE')
})
