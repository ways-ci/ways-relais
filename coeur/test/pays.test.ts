import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numeroInternational } from '../pays.ts'

function ok(numero: unknown, pays: unknown): string {
  const r = numeroInternational(numero, pays)
  assert.ok(r.ok, `refusé à tort : ${numero} (${pays}) : ${!r.ok ? r.erreur : ''}`)
  return r.international
}
function refuse(numero: unknown, pays: unknown): string {
  const r = numeroInternational(numero, pays)
  assert.ok(!r.ok, `accepté à tort : ${numero} (${pays}) => ${r.ok ? r.international : ''}`)
  return r.erreur
}

test('CAS FAUTIF : numéro sans pays, refusé et jamais supposé ivoirien', () => {
  assert.match(refuse('0700000000', undefined), /Pays manquant/)
  assert.match(refuse('0700000000', ''), /Pays manquant/)
  assert.match(refuse('0700000000', null), /Pays manquant/)
})

test('pays inconnu refusé, avec la liste des pays pris en charge', () => {
  assert.match(refuse('0700000000', 'FR'), /inconnu.*CI, BF, SN, ML, TG, BJ, NE/)
})

test("Côte d'Ivoire : le zéro se conserve après l'indicatif", () => {
  assert.equal(ok('07 00 00 00 00', 'CI'), '2250700000000')
  assert.equal(ok('+225 07 00 00 00 00', 'ci'), '2250700000000')
  assert.equal(ok('002250700000000', 'CI'), '2250700000000')
  assert.equal(ok('2250700000000', 'CI'), '2250700000000')
  const r = numeroInternational('0700000000', 'CI')
  assert.ok(r.ok && r.e164 === '+2250700000000' && r.nomPays === "Côte d'Ivoire")
})

test("Côte d'Ivoire : l'ancienne forme à huit chiffres et le numéro sans zéro sont refusés", () => {
  refuse('07000000', 'CI')
  refuse('700000000', 'CI')
  refuse('+225 700000000', 'CI')
})

test('ailleurs, le zéro saisi par habitude tombe AVANT la concaténation', () => {
  // Défaut déjà vécu : « 078321504 » au Burkina ressortait en 226078321504.
  assert.equal(ok('078321504', 'BF'), '22678321504')
  assert.equal(ok('78 32 15 04', 'BF'), '22678321504')
  assert.equal(ok('77 000 00 00', 'SN'), '221770000000')
  assert.equal(ok('+221 77 000 00 00', 'SN'), '221770000000')
  assert.equal(ok('90 00 00 00', 'TG'), '22890000000')
  assert.equal(ok('70 00 00 00', 'ML'), '22370000000')
  assert.equal(ok('90 00 00 00', 'NE'), '22790000000')
})

test('Bénin : le « 01 » des numéros à dix chiffres fait partie du numéro', () => {
  assert.equal(ok('01 97 45 22 18', 'BJ'), '2290197452218')
  assert.equal(ok('+229 01 97 45 22 18', 'BJ'), '2290197452218')
  assert.equal(ok('97 45 22 18', 'BJ'), '22997452218')
})

test("un indicatif écrit qui contredit le pays choisi est refusé, jamais réinterprété", () => {
  // Défaut déjà vécu : « +226 78321504 » repartait en 22522678321504.
  assert.match(refuse('+226 78321504', 'CI'), /autre indicatif/)
  assert.match(refuse('00221770000000', 'CI'), /autre indicatif/)
})

test('longueurs fausses refusées partout', () => {
  refuse('7832150', 'BF')
  refuse('783215041', 'BF')
  refuse('7700000', 'SN')
  refuse('', 'CI')
  refuse('abc', 'CI')
  refuse(null, 'SN')
})
