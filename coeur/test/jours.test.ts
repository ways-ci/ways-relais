import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireDate, lireAjouts, jourFerie, prochainJourOuvre, paques, fetesNonAnnoncees, feriesCalcules, JOURS_ANNONCES, FETES_ANNONCEES } from '../jours.ts'
import type { DateSimple } from '../jours.ts'

function d(texte: string): DateSimple {
  const r = lireDate(texte)
  assert.ok(r.ok, `date refusée à tort : ${texte}`)
  return r.date
}

test('CAS FAUTIF : 29 février refusé les années non bissextiles, admis les autres', () => {
  for (const t of ['2026-02-29', '29/02/2026', '2027-02-29', '2100-02-29', '2026-02-29T10:00:00Z']) {
    const r = lireDate(t)
    assert.ok(!r.ok, `accepté à tort : ${t}`)
    assert.match(r.erreur, /n'existe pas/)
  }
  assert.equal(jourFerie(d('2028-02-29')).ferie, false)
  assert.equal(jourFerie(d('29/02/2028')).date, '2028-02-29')
})

test('dates invalides ou illisibles refusées', () => {
  for (const t of ['2026-04-31', '31/04/2026', '2026-13-01', '00/01/2026', 'demain', '', '2026/05/27', '2011-01-01', '2101-01-01']) {
    assert.ok(!lireDate(t).ok, `accepté à tort : ${t}`)
  }
  assert.ok(!lireDate(new Date('pas une date')).ok)
  assert.ok(!lireDate(undefined).ok)
})

test('date-heure ISO lue à l\'heure d\'Abidjan (UTC)', () => {
  assert.equal(jourFerie(d('2026-12-24T23:30:00Z')).date, '2026-12-24')
  // 23h30 à Paris le 24 = 22h30 à Abidjan, toujours le 24.
  assert.equal(jourFerie(d('2026-12-24T23:30:00+01:00')).date, '2026-12-24')
  // 01h00 du 25 à Paris = 00h00 du 25 à Abidjan.
  assert.equal(jourFerie(d('2026-12-25T01:00:00+01:00')).nom, 'Noël')
})

test('Pâques : dates de référence connues', () => {
  const connues: [number, string][] = [[2024, '3-31'], [2025, '4-20'], [2026, '4-5'], [2027, '3-28'], [2028, '4-16'], [2038, '4-25'], [2049, '4-18']]
  for (const [annee, md] of connues) {
    const p = paques(annee)
    assert.equal(`${p.mois}-${p.jour}`, md, `Pâques ${annee}`)
  }
})

test('2026 : fêtes calculées conformes à la vérification du 14/11', () => {
  const dates = feriesCalcules(2026).map((f) => `${f.date} ${f.nom}`)
  assert.deepEqual(dates, [
    "2026-01-01 Jour de l'an",
    '2026-04-06 Lundi de Pâques',
    '2026-05-01 Fête du Travail',
    '2026-05-14 Ascension',
    '2026-05-25 Lundi de Pentecôte',
    '2026-08-07 Fête nationale (Indépendance)',
    '2026-08-15 Assomption',
    '2026-11-01 Toussaint',
    '2026-11-15 Journée nationale de la Paix',
    '2026-12-25 Noël',
  ])
})

test('CAS FAUTIF : jour de Tabaski. Annoncé en 2026, jamais deviné en 2027', () => {
  const t2026 = jourFerie(d('2026-05-27'))
  assert.equal(t2026.ferie, true)
  assert.equal(t2026.nom, 'Tabaski (Aïd el-Kébir)')
  assert.equal(t2026.certitude, 'certain')
  assert.match(t2026.source ?? '', /koaci/)

  // Les calendriers en ligne placent la Tabaski 2027 vers le 16 ou le 17 mai,
  // et l'Aïd el-Fitr vers le 9 ou le 10 mars. Aucun communiqué : la réponse
  // ne peut pas être « ouvré » tout court. (Le 17/05/2027 est de toute façon
  // le lundi de Pentecôte, férié par le calcul.)
  for (const jour of ['2027-05-16', '2027-03-09', '2027-03-10']) {
    const r = jourFerie(d(jour))
    assert.equal(r.ferie, false)
    assert.equal(r.certitude, 'sous réserve')
    assert.ok(r.nonAnnoncees.includes('Tabaski (Aïd el-Kébir)'))
  }
  assert.equal(jourFerie(d('2027-05-17')).nom, 'Lundi de Pentecôte')
  assert.deepEqual(fetesNonAnnoncees(2027), [...FETES_ANNONCEES])
  assert.deepEqual(fetesNonAnnoncees(2026), [])
})

test("une date annoncée par l'utilisateur complète l'année, avec sa source", () => {
  const ajouts = lireAjouts([{ date: '10/03/2027', nom: 'Aïd el-Fitr (fin du Ramadan)', source: 'Communiqué du ministère de l\'Emploi (essai)' }])
  assert.ok(ajouts.ok)
  assert.equal(jourFerie(d('2027-03-10')).ferie, false)
  const r = jourFerie(d('2027-03-10'), ajouts.ajouts)
  assert.equal(r.ferie, true)
  assert.equal(r.nom, 'Aïd el-Fitr (fin du Ramadan)')
  assert.equal(r.certitude, 'certain')
  // Le lendemain reste sous réserve : trois fêtes 2027 ne sont pas annoncées.
  assert.equal(jourFerie(d('2027-03-11'), ajouts.ajouts).certitude, 'sous réserve')
  assert.equal(fetesNonAnnoncees(2027, ajouts.ajouts).length, 3)
})

test('un ajout sans source, ou à une date qui n\'existe pas, est refusé', () => {
  const sansSource = lireAjouts([{ date: '2027-05-17', nom: 'Tabaski (Aïd el-Kébir)', source: '' }])
  assert.ok(!sansSource.ok && /source manquante/.test(sansSource.erreur))
  assert.ok(!lireAjouts([{ date: '2027-02-29', nom: 'x', source: 'y' }]).ok)
  assert.ok(!lireAjouts('pas une liste').ok)
  assert.ok(lireAjouts(undefined).ok)
})

test('la table des annonces : chaque ligne a une date réelle, un nom connu et une source', () => {
  for (const j of JOURS_ANNONCES) {
    assert.ok(lireDate(j.date).ok, j.date)
    assert.ok((FETES_ANNONCEES as readonly string[]).includes(j.nom), j.nom)
    assert.match(j.source, /https:\/\//)
  }
})

test("prochain jour ouvré : saute le week-end et les fêtes, et dit pourquoi", () => {
  // Jeudi 02/04/2026 → vendredi 03/04.
  assert.equal(prochainJourOuvre(d('2026-04-02')).date, '2026-04-03')
  // Vendredi 03/04/2026 → samedi, dimanche, lundi de Pâques → mardi 07/04.
  const paques2026 = prochainJourOuvre(d('2026-04-03'))
  assert.equal(paques2026.date, '2026-04-07')
  assert.equal(paques2026.dateEnLettres, 'mardi 7 avril 2026')
  assert.deepEqual(paques2026.sautes.map((s) => s.raison), ['samedi', 'dimanche', 'Lundi de Pâques'])
  assert.equal(paques2026.certitude, 'certain')
  // Mardi 26/05/2026 : le 27 est la Tabaski → jeudi 28.
  assert.equal(prochainJourOuvre(d('2026-05-26')).date, '2026-05-28')
  // Avec le samedi ouvré : vendredi 03/04 → samedi 04/04.
  assert.equal(prochainJourOuvre(d('2026-04-03'), { samediOuvre: true }).date, '2026-04-04')
  // Jeudi 24/12/2026 : Noël le vendredi → lundi 28.
  assert.equal(prochainJourOuvre(d('2026-12-24')).date, '2026-12-28')
})

test('prochain jour ouvré en 2027 : sous réserve tant que les fêtes musulmanes ne sont pas annoncées', () => {
  const r = prochainJourOuvre(d('2027-05-14'))
  assert.equal(r.date, '2027-05-18') // 15-16 week-end, 17 lundi de Pentecôte
  assert.equal(r.certitude, 'sous réserve')
  assert.equal(r.nonAnnoncees.length, 4)
})

test('1er du mois écrit « 1er »', () => {
  assert.equal(jourFerie(d('2026-01-01')).dateEnLettres, 'jeudi 1er janvier 2026')
})
