/**
 * Montants en francs CFA : en chiffres et en lettres.
 *
 * LE FRANC CFA N'A PAS DE CENTIMES. Un montant à virgule est donc refusé, et
 * jamais arrondi : un montant arrondi en silence sur une facture ou un reçu est
 * une erreur que personne ne voit avant le litige.
 *
 * Les lettres suivent l'orthographe traditionnelle, celle des chèques et des
 * actes : traits d'union seulement sous cent, « vingt et un », « soixante et
 * onze », « quatre-vingts » mais « quatre-vingt-un », « deux cents » mais
 * « deux cent mille », « mille » invariable, « deux millions de francs CFA ».
 */

/** Le plus grand montant accepté : 999 milliards. */
export const MONTANT_MAX = 999_999_999_999

/** Espace insécable : un montant ne se coupe jamais en fin de ligne. */
const INSECABLE = '\u00a0'

import { refus } from './refus.ts'
import type { Refus } from './refus.ts'

export type ResultatMontant =
  | { ok: true; montant: number; chiffres: string; lettres: string }
  | Refus

/**
 * Lit un montant. Accepte un nombre entier, ou un texte de chiffres dont les
 * milliers sont séparés par des espaces ou des points, groupés par trois
 * (« 1 500 000 », « 1.500.000 »). Tout le reste est refusé avec sa raison.
 */
export function lireMontant(valeur: unknown): { ok: true; montant: number } | Refus {
  if (typeof valeur === 'number') {
    if (!Number.isFinite(valeur)) return refus('MONTANT_ILLISIBLE', "Ce n'est pas un montant.", 'Not an amount.')
    if (!Number.isInteger(valeur)) {
      return refus('MONTANT_A_VIRGULE', "Montant à virgule refusé : le franc CFA n'a pas de centimes.", 'Decimal amounts are refused: the CFA franc has no cents.')
    }
    return borner(valeur)
  }
  if (typeof valeur !== 'string') return refus('MONTANT_MANQUANT', 'Montant manquant.', 'Amount is missing.')

  const t = valeur.trim().replace(/[\s\u00a0\u202f]/g, ' ').replace(/\s*(F\s*CFA|FCFA|XOF|F)$/i, '').trim()
  if (!t) return refus('MONTANT_MANQUANT', 'Montant manquant.', 'Amount is missing.')
  if (t.includes(',')) {
    return refus('MONTANT_A_VIRGULE', "Montant à virgule refusé : le franc CFA n'a pas de centimes.", 'Decimal amounts are refused: the CFA franc has no cents.')
  }
  if (t.startsWith('-')) return refus('MONTANT_NEGATIF', 'Montant négatif refusé.', 'Negative amounts are refused.')
  const groupesValides = /^\d+$/.test(t) || /^\d{1,3}([ .]\d{3})+$/.test(t)
  if (!groupesValides) {
    return t.includes('.')
      ? refus(
          'MONTANT_A_VIRGULE',
          "Montant à virgule refusé : le franc CFA n'a pas de centimes. Les milliers s'écrivent par groupes de trois (1.500.000).",
          'Decimal amounts are refused: the CFA franc has no cents. Thousands are written in groups of three (1.500.000).',
        )
      : refus('MONTANT_ILLISIBLE', `Montant illisible : « ${valeur} ».`, `Unreadable amount: "${valeur}".`)
  }
  return borner(Number(t.replace(/[ .]/g, '')))
}

function borner(n: number): { ok: true; montant: number } | Refus {
  if (n < 0) return refus('MONTANT_NEGATIF', 'Montant négatif refusé.', 'Negative amounts are refused.')
  if (n > MONTANT_MAX) return refus('MONTANT_TROP_GRAND', 'Montant trop grand : 999 milliards au plus.', 'Amount too large: 999 billion at most.')
  return { ok: true, montant: n }
}

/** « 1 500 000 FCFA », milliers séparés par des espaces insécables. */
export function enChiffres(montant: number): string {
  const groupes = String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, INSECABLE)
  return `${groupes}${INSECABLE}FCFA`
}

const UNITES = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
]
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante']

/**
 * De 1 à 99. `accord` dit si « quatre-vingts » prend son s : oui en fin de
 * nombre ou devant million et milliard (des noms), non devant mille.
 */
function sousCent(n: number, accord: boolean): string {
  if (n < 20) return UNITES[n]
  if (n < 70) {
    const d = Math.floor(n / 10)
    const u = n % 10
    if (u === 0) return DIZAINES[d]
    if (u === 1) return `${DIZAINES[d]} et un`
    return `${DIZAINES[d]}-${UNITES[u]}`
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${UNITES[n - 60]}`
  if (n === 80) return accord ? 'quatre-vingts' : 'quatre-vingt'
  return `quatre-vingt-${UNITES[n - 80]}`
}

/** De 1 à 999, même règle d'accord pour « cents ». */
function sousMille(n: number, accord: boolean): string {
  const c = Math.floor(n / 100)
  const r = n % 100
  const reste = r ? sousCent(r, accord) : ''
  if (c === 0) return reste
  const cent = c === 1 ? 'cent' : `${UNITES[c]} cent${r === 0 && accord ? 's' : ''}`
  return reste ? `${cent} ${reste}` : cent
}

/** Le nombre seul, en lettres : « un million cinq cent mille ». */
export function nombreEnLettres(n: number): string {
  if (n === 0) return 'zéro'
  const milliards = Math.floor(n / 1e9)
  const millions = Math.floor(n / 1e6) % 1000
  const milliers = Math.floor(n / 1e3) % 1000
  const reste = n % 1000
  const mots: string[] = []
  if (milliards) mots.push(`${sousMille(milliards, true)} milliard${milliards > 1 ? 's' : ''}`)
  if (millions) mots.push(`${sousMille(millions, true)} million${millions > 1 ? 's' : ''}`)
  if (milliers) mots.push(milliers === 1 ? 'mille' : `${sousMille(milliers, false)} mille`)
  if (reste) mots.push(sousMille(reste, true))
  return mots.join(' ')
}

/** Le montant en lettres, avec sa devise : « deux millions de francs CFA ». */
export function enLettres(montant: number): string {
  if (montant === 0) return 'zéro franc CFA'
  if (montant === 1) return 'un franc CFA'
  // « de » quand le nombre finit par million ou milliard, qui sont des noms.
  const de = montant >= 1e6 && montant % 1e6 === 0 ? 'de ' : ''
  return `${nombreEnLettres(montant)} ${de}francs CFA`
}

/** Lit le montant et rend les deux écritures, ou la raison du refus. */
export function montantFcfa(valeur: unknown): ResultatMontant {
  const lu = lireMontant(valeur)
  if (!lu.ok) return lu
  return { ok: true, montant: lu.montant, chiffres: enChiffres(lu.montant), lettres: enLettres(lu.montant) }
}
