import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actionNumero, actionMontant, actionJour } from '../actions.ts'
import type { Resultat } from '../actions.ts'

function sortie<T>(r: Resultat<T>): T {
  assert.ok(r.ok, `refusé à tort : ${!r.ok ? r.erreur : ''}`)
  return r.sortie
}
function code<T>(r: Resultat<T>): string {
  assert.ok(!r.ok, 'accepté à tort')
  return r.code
}

test('numéro : la sortie porte les deux écritures et le pays en anglais', () => {
  assert.deepEqual(sortie(actionNumero('07 00 00 00 00', 'CI')), {
    international: '2250700000000',
    e164: '+2250700000000',
    country: 'CI',
    countryName: "Côte d'Ivoire",
  })
  assert.equal(sortie(actionNumero('77 000 00 00', 'sn')).countryName, 'Senegal')
})

test('CAS FAUTIF : numéro sans pays, refus PAYS_MANQUANT', () => {
  assert.equal(code(actionNumero('0700000000', '')), 'PAYS_MANQUANT')
})

test('montant : chiffres, lettres, montant lu', () => {
  assert.deepEqual(sortie(actionMontant('1.500.000')), {
    amount: 1_500_000,
    digits: '1 500 000 FCFA',
    words: 'un million cinq cent mille francs CFA',
  })
})

test('CAS FAUTIF : montant à virgule, refus MONTANT_A_VIRGULE', () => {
  assert.equal(code(actionMontant('2500,75')), 'MONTANT_A_VIRGULE')
})

test('jour : Noël 2026 est férié, le prochain jour ouvré saute le week-end', () => {
  const s = sortie(actionJour('2026-12-24'))
  assert.equal(s.isHoliday, false)
  assert.equal(s.isWorkingDay, true)
  assert.equal(s.certainty, 'certain')
  assert.equal(s.nextWorkingDay.date, '2026-12-28')
  assert.deepEqual(s.nextWorkingDay.skipped, [
    { date: '2026-12-25', reason: 'Noël' },
    { date: '2026-12-26', reason: 'saturday' },
    { date: '2026-12-27', reason: 'sunday' },
  ])
  const noel = sortie(actionJour('25/12/2026'))
  assert.equal(noel.isHoliday, true)
  assert.equal(noel.holidayName, 'Noël')
  assert.equal(noel.isWorkingDay, false)
})

test('jour : le samedi ouvré change le prochain jour ouvré', () => {
  const s = sortie(actionJour('2026-12-24', { saturdayIsWorkingDay: true }))
  assert.equal(s.nextWorkingDay.date, '2026-12-26')
  assert.equal(sortie(actionJour('2026-12-26', { saturdayIsWorkingDay: true })).isWorkingDay, true)
  assert.equal(sortie(actionJour('2026-12-26')).isWorkingDay, false)
})

test('CAS FAUTIF : 2027 sans annonce reste « subject_to_announcement », jamais « certain »', () => {
  const s = sortie(actionJour('2027-05-18'))
  assert.equal(s.certainty, 'subject_to_announcement')
  assert.ok(s.unannouncedHolidays.length > 0)
})

test('jour : une date annoncée par l’utilisateur, avec sa source, devient fériée', () => {
  const s = sortie(
    actionJour('2027-05-18', {
      announcedDays: [{ date: '2027-05-18', nom: 'Tabaski (Aïd el-Kébir)', source: 'Communiqué de test' }],
    }),
  )
  assert.equal(s.isHoliday, true)
  assert.equal(s.holidaySource, 'Communiqué de test')
})

test('CAS FAUTIF : 29 février 2027 refusé, annonce sans source refusée', () => {
  assert.equal(code(actionJour('2027-02-29')), 'DATE_INEXISTANTE')
  assert.equal(
    code(actionJour('2027-05-18', { announcedDays: [{ date: '2027-05-18', nom: 'Tabaski (Aïd el-Kébir)', source: '' }] })),
    'AJOUT_SANS_SOURCE',
  )
})
