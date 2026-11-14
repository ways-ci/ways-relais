import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enLettres, enChiffres, montantFcfa, nombreEnLettres } from '../fcfa.ts'

const NBSP = ' '

test('CAS FAUTIF : montant à virgule refusé, jamais arrondi', () => {
  for (const v of [1500.5, '1500,50', '1 500,5', '1.5', '12.50', 0.1]) {
    const r = montantFcfa(v)
    assert.ok(!r.ok, `accepté à tort : ${v}`)
    assert.match(r.erreur, /virgule/)
  }
})

test('autres montants refusés avec leur raison', () => {
  assert.match((montantFcfa(-500) as { erreur: string }).erreur, /négatif/)
  assert.match((montantFcfa('-500') as { erreur: string }).erreur, /négatif/)
  assert.match((montantFcfa(1e12) as { erreur: string }).erreur, /trop grand/)
  assert.match((montantFcfa('') as { erreur: string }).erreur, /manquant/)
  assert.match((montantFcfa(undefined) as { erreur: string }).erreur, /manquant/)
  assert.match((montantFcfa(Number.NaN) as { erreur: string }).erreur, /pas un montant/)
  assert.ok(!montantFcfa('15 00').ok, 'groupes de milliers mal formés')
  assert.ok(!montantFcfa('1 5000').ok, 'groupes de milliers mal formés')
  assert.ok(!montantFcfa('douze').ok)
})

test('lectures admises : entier, espaces ou points des milliers, devise en fin', () => {
  for (const v of [1500000, '1500000', '1 500 000', '1.500.000', `1${NBSP}500${NBSP}000`, '1 500 000 FCFA', '1 500 000 F CFA', '1500000 F']) {
    const r = montantFcfa(v)
    assert.ok(r.ok && r.montant === 1500000, `mal lu : ${v}`)
  }
})

test('en chiffres, milliers séparés par des espaces insécables', () => {
  assert.equal(enChiffres(1500000), `1${NBSP}500${NBSP}000${NBSP}FCFA`)
  assert.equal(enChiffres(950), `950${NBSP}FCFA`)
  assert.equal(enChiffres(0), `0${NBSP}FCFA`)
})

test("en lettres, orthographe traditionnelle", () => {
  const attendu: [number, string][] = [
    [0, 'zéro'],
    [1, 'un'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [21, 'vingt et un'],
    [22, 'vingt-deux'],
    [61, 'soixante et un'],
    [70, 'soixante-dix'],
    [71, 'soixante et onze'],
    [72, 'soixante-douze'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [90, 'quatre-vingt-dix'],
    [91, 'quatre-vingt-onze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent un'],
    [200, 'deux cents'],
    [201, 'deux cent un'],
    [280, 'deux cent quatre-vingts'],
    [1000, 'mille'],
    [1001, 'mille un'],
    [2000, 'deux mille'],
    [15000, 'quinze mille'],
    [21000, 'vingt et un mille'],
    [80000, 'quatre-vingt mille'],
    [200000, 'deux cent mille'],
    [1000000, 'un million'],
    [1500000, 'un million cinq cent mille'],
    [2000000, 'deux millions'],
    [280000000, 'deux cent quatre-vingts millions'],
    [1000000000, 'un milliard'],
    [3200000000, 'trois milliards deux cents millions'],
    [
      999999999999,
      'neuf cent quatre-vingt-dix-neuf milliards neuf cent quatre-vingt-dix-neuf millions neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf',
    ],
  ]
  for (const [n, lettres] of attendu) assert.equal(nombreEnLettres(n), lettres, `pour ${n}`)
})

test('la devise : franc au singulier, « de » après million et milliard', () => {
  assert.equal(enLettres(0), 'zéro franc CFA')
  assert.equal(enLettres(1), 'un franc CFA')
  assert.equal(enLettres(2), 'deux francs CFA')
  assert.equal(enLettres(25000), 'vingt-cinq mille francs CFA')
  assert.equal(enLettres(1500000), 'un million cinq cent mille francs CFA')
  assert.equal(enLettres(2000000), 'deux millions de francs CFA')
  assert.equal(enLettres(1000000000), 'un milliard de francs CFA')
  assert.equal(enLettres(1000001), 'un million un francs CFA')
})
