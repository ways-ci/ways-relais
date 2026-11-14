/**
 * Jours fériés de Côte d'Ivoire et jours ouvrés.
 *
 * TEXTE : décret n° 96-205 du 7 mars 1996, article 2 modifié par le décret
 * n° 2011-371 du 4 novembre 2011 (cité par les communiqués officiels de 2026).
 *
 * TROIS SORTES DE FÊTES, TROIS TRAITEMENTS.
 * - Les fêtes à date fixe se codent ici.
 * - Les fêtes chrétiennes mobiles se calculent : la date de Pâques est du calcul
 *   de calendrier, sans part d'incertitude.
 * - LES FÊTES MUSULMANES NE SE CALCULENT PAS, ELLES S'ANNONCENT. Le ministre de
 *   l'Emploi les fixe par communiqué, deux à quatre jours avant. Elles vivent
 *   dans une table datée et sourcée (`JOURS_ANNONCES`), complétée à chaque
 *   communiqué, et l'utilisateur peut y ajouter lui-même une date annoncée.
 *   Une année dont la table est incomplète ne rend JAMAIS une réponse certaine :
 *   « ouvré, sous réserve », avec la liste des fêtes pas encore annoncées.
 *
 * NON CODÉ, VOLONTAIREMENT : le jour de plus quand une fête tombe un dimanche.
 * Le texte officiel intégral n'a pas encore été lu (vérification du 14/11/2026).
 * D'ici là, un jour de remplacement n'existe ici que s'il a été annoncé, et il
 * s'ajoute à la table comme une fête annoncée.
 *
 * Abidjan vit à l'heure UTC toute l'année : une date se lit en UTC.
 */

import { refus } from './refus.ts'
import type { Refus } from './refus.ts'

export interface DateSimple {
  annee: number
  mois: number
  jour: number
}

export interface JourAnnonce {
  /** AAAA-MM-JJ */
  date: string
  nom: string
  /** D'où vient la date : communiqué, presse qui le relaie, avec l'adresse lue. */
  source: string
}

/** Les quatre fêtes musulmanes chômées, telles que nommées dans les communiqués. */
export const FETES_ANNONCEES = [
  'Lendemain de la Nuit du Destin',
  'Aïd el-Fitr (fin du Ramadan)',
  'Tabaski (Aïd el-Kébir)',
  'Lendemain du Maouloud',
] as const

/**
 * Dates annoncées, une ligne par communiqué. Une date ne s'écrit ici qu'avec sa
 * source. Les années futures restent vides tant que le communiqué n'est pas
 * sorti : les calendriers en ligne qui les « prévoient » se contredisent.
 */
export const JOURS_ANNONCES: readonly JourAnnonce[] = [
  {
    date: '2026-03-16',
    nom: 'Lendemain de la Nuit du Destin',
    source: 'Communiqué du ministère de l\'Emploi du 12/03/2026, relayé : https://fr.allafrica.com/stories/202603160320.html',
  },
  {
    date: '2026-03-20',
    nom: 'Aïd el-Fitr (fin du Ramadan)',
    source: 'Communiqué du ministère de l\'Emploi du 18/03/2026, relayé : https://fr.allafrica.com/stories/202603190231.html',
  },
  {
    date: '2026-05-27',
    nom: 'Tabaski (Aïd el-Kébir)',
    source: 'Communiqué relayé par la presse : https://www.koaci.com/index.php/article/2026/05/22/cote-divoire/societe/cote-divoire-fermeture-du-consulat-general-de-paris-le-25-et-le-27-mai_196880.html',
  },
  {
    date: '2026-08-25',
    nom: 'Lendemain du Maouloud',
    source: 'Communiqué du 21/08/2026 relayé par l\'AIP : https://www.aip.ci/cote-divoire-aip-le-maouloud-2026-celebre-dans-la-nuit-du-lundi-au-mardi-le-25-aout-declare-jour-ferie-et-chome/',
  },
]

/** Années couvertes par le calcul : le décret de 2011 fixe la liste actuelle. */
export const ANNEE_MIN = 2012
export const ANNEE_MAX = 2100

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

// ---------------------------------------------------------------------------
// Lecture des dates
// ---------------------------------------------------------------------------

/**
 * Lit une date : « 2026-05-27 », « 27/05/2026 », une date-heure ISO ou un
 * objet Date. Refuse ce qui n'existe pas (le 29 février d'une année non
 * bissextile, le 31 avril) au lieu de le reporter au lendemain comme le fait
 * JavaScript.
 */
export function lireDate(valeur: unknown): { ok: true; date: DateSimple } | Refus {
  if (valeur instanceof Date) {
    if (Number.isNaN(valeur.getTime())) return refus('DATE_ILLISIBLE', 'Date invalide.', 'Invalid date.')
    return borner({ annee: valeur.getUTCFullYear(), mois: valeur.getUTCMonth() + 1, jour: valeur.getUTCDate() })
  }
  if (typeof valeur !== 'string' || !valeur.trim()) return refus('DATE_MANQUANTE', 'Date manquante.', 'Date is missing.')
  const t = valeur.trim()

  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t)
  if (m) return verifier(+m[1], +m[2], +m[3], t)
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t)
  if (m) return verifier(+m[3], +m[2], +m[1], t)

  m = /^(\d{4})-(\d{2})-(\d{2})T/.exec(t)
  if (m) {
    const partie = verifier(+m[1], +m[2], +m[3], t)
    if (!partie.ok) return partie
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return refus('DATE_ILLISIBLE', `Date illisible : « ${t} ».`, `Unreadable date: "${t}".`)
    return lireDate(d)
  }
  return refus(
    'DATE_ILLISIBLE',
    `Date illisible : « ${t} ». Formats acceptés : 2026-05-27 ou 27/05/2026.`,
    `Unreadable date: "${t}". Accepted formats: 2026-05-27 or 27/05/2026.`,
  )
}

function verifier(annee: number, mois: number, jour: number, texte: string) {
  const d = new Date(Date.UTC(annee, mois - 1, jour))
  if (d.getUTCFullYear() !== annee || d.getUTCMonth() !== mois - 1 || d.getUTCDate() !== jour) {
    return refus('DATE_INEXISTANTE', `Cette date n'existe pas : « ${texte} ».`, `This date does not exist: "${texte}".`)
  }
  return borner({ annee, mois, jour })
}

function borner(d: DateSimple): { ok: true; date: DateSimple } | Refus {
  if (d.annee < ANNEE_MIN || d.annee > ANNEE_MAX) {
    return refus(
      'ANNEE_HORS_CALENDRIER',
      `Année ${d.annee} hors du calendrier pris en charge (${ANNEE_MIN} à ${ANNEE_MAX}).`,
      `Year ${d.annee} is outside the supported calendar (${ANNEE_MIN} to ${ANNEE_MAX}).`,
    )
  }
  return { ok: true, date: d }
}

export function versIso(d: DateSimple): string {
  return `${d.annee}-${String(d.mois).padStart(2, '0')}-${String(d.jour).padStart(2, '0')}`
}

/** « mercredi 27 mai 2026 » */
export function enToutesLettres(d: DateSimple): string {
  const js = new Date(Date.UTC(d.annee, d.mois - 1, d.jour))
  const jour = d.jour === 1 ? '1er' : String(d.jour)
  return `${JOURS_SEMAINE[js.getUTCDay()]} ${jour} ${MOIS[d.mois - 1]} ${d.annee}`
}

function jourDeSemaine(d: DateSimple): number {
  return new Date(Date.UTC(d.annee, d.mois - 1, d.jour)).getUTCDay()
}

function decaler(d: DateSimple, jours: number): DateSimple {
  const js = new Date(Date.UTC(d.annee, d.mois - 1, d.jour + jours))
  return { annee: js.getUTCFullYear(), mois: js.getUTCMonth() + 1, jour: js.getUTCDate() }
}

// ---------------------------------------------------------------------------
// Fêtes
// ---------------------------------------------------------------------------

/** Dimanche de Pâques, calendrier grégorien (algorithme de Meeus, Jones et Butcher). */
export function paques(annee: number): DateSimple {
  const a = annee % 19
  const b = Math.floor(annee / 100)
  const c = annee % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mois = Math.floor((h + l - 7 * m + 114) / 31)
  const jour = ((h + l - 7 * m + 114) % 31) + 1
  return { annee, mois, jour }
}

/** Fêtes fixes et chrétiennes mobiles d'une année : celles qui se savent d'avance. */
export function feriesCalcules(annee: number): { date: string; nom: string }[] {
  const p = paques(annee)
  const liste = [
    { date: versIso({ annee, mois: 1, jour: 1 }), nom: "Jour de l'an" },
    { date: versIso(decaler(p, 1)), nom: 'Lundi de Pâques' },
    { date: versIso({ annee, mois: 5, jour: 1 }), nom: 'Fête du Travail' },
    { date: versIso(decaler(p, 39)), nom: 'Ascension' },
    { date: versIso(decaler(p, 50)), nom: 'Lundi de Pentecôte' },
    { date: versIso({ annee, mois: 8, jour: 7 }), nom: "Fête nationale (Indépendance)" },
    { date: versIso({ annee, mois: 8, jour: 15 }), nom: 'Assomption' },
    { date: versIso({ annee, mois: 11, jour: 1 }), nom: 'Toussaint' },
    { date: versIso({ annee, mois: 11, jour: 15 }), nom: 'Journée nationale de la Paix' },
    { date: versIso({ annee, mois: 12, jour: 25 }), nom: 'Noël' },
  ]
  return liste.sort((x, y) => x.date.localeCompare(y.date))
}

/** Les fêtes annoncées d'une année : la table, plus celles ajoutées par l'utilisateur. */
function annoncesDe(annee: number, ajouts: readonly JourAnnonce[]): JourAnnonce[] {
  return [...JOURS_ANNONCES, ...ajouts].filter((j) => j.date.startsWith(`${annee}-`))
}

/** Les fêtes musulmanes dont la date n'est pas encore annoncée pour cette année. */
export function fetesNonAnnoncees(annee: number, ajouts: readonly JourAnnonce[] = []): string[] {
  const noms = new Set(annoncesDe(annee, ajouts).map((j) => j.nom))
  return FETES_ANNONCEES.filter((f) => !noms.has(f))
}

export interface Reponse {
  date: string
  dateEnLettres: string
  /** « certain » ou « sous réserve » : une fête de l'année n'est pas encore annoncée. */
  certitude: 'certain' | 'sous réserve'
  /** Les fêtes qui pourraient encore tomber ce jour-là, faute d'annonce. */
  nonAnnoncees: string[]
}

export interface ReponseFerie extends Reponse {
  ferie: boolean
  nom: string | null
  source: string | null
}

/** Ce jour est-il férié en Côte d'Ivoire ? */
export function jourFerie(d: DateSimple, ajouts: readonly JourAnnonce[] = []): ReponseFerie {
  const iso = versIso(d)
  const base = { date: iso, dateEnLettres: enToutesLettres(d) }
  const calcule = feriesCalcules(d.annee).find((f) => f.date === iso)
  if (calcule) {
    return { ...base, ferie: true, nom: calcule.nom, source: 'Décret n° 96-205 modifié par le décret n° 2011-371', certitude: 'certain', nonAnnoncees: [] }
  }
  const annonce = annoncesDe(d.annee, ajouts).find((j) => j.date === iso)
  if (annonce) {
    return { ...base, ferie: true, nom: annonce.nom, source: annonce.source, certitude: 'certain', nonAnnoncees: [] }
  }
  const manquantes = fetesNonAnnoncees(d.annee, ajouts)
  return {
    ...base,
    ferie: false,
    nom: null,
    source: null,
    certitude: manquantes.length ? 'sous réserve' : 'certain',
    nonAnnoncees: manquantes,
  }
}

export interface OptionsOuvre {
  /** Le samedi compte-t-il comme jour ouvré ? Non par défaut (bureaux). */
  samediOuvre?: boolean
  ajouts?: readonly JourAnnonce[]
}

export interface ReponseOuvre extends Reponse {
  /** Les jours sautés pour y arriver, fériés ou week-end, avec leur raison. */
  sautes: { date: string; raison: string }[]
}

/**
 * Le prochain jour ouvré STRICTEMENT après la date donnée.
 * Exemple : le vendredi veille d'un lundi de Pâques rend le mardi.
 */
export function prochainJourOuvre(d: DateSimple, options: OptionsOuvre = {}): ReponseOuvre {
  const ajouts = options.ajouts ?? []
  const sautes: { date: string; raison: string }[] = []
  const reserves = new Set<string>()
  let courant = decaler(d, 1)
  // Garde-fou : jamais plus de 60 jours de suite sans jour ouvré.
  for (let i = 0; i < 60; i++) {
    const js = jourDeSemaine(courant)
    const weekEnd = js === 0 || (js === 6 && !options.samediOuvre)
    const f = jourFerie(courant, ajouts)
    if (weekEnd) {
      sautes.push({ date: versIso(courant), raison: js === 0 ? 'dimanche' : 'samedi' })
    } else if (f.ferie) {
      sautes.push({ date: versIso(courant), raison: f.nom ?? 'jour férié' })
    } else {
      // Chaque jour ouvré « sous réserve » rend toute la réponse sous réserve.
      f.nonAnnoncees.forEach((n) => reserves.add(n))
      return {
        date: versIso(courant),
        dateEnLettres: enToutesLettres(courant),
        certitude: reserves.size ? 'sous réserve' : 'certain',
        nonAnnoncees: [...reserves],
        sautes,
      }
    }
    courant = decaler(courant, 1)
  }
  throw new Error('Aucun jour ouvré trouvé en 60 jours : calendrier incohérent.')
}

/**
 * Valide une liste de jours annoncés fournie par l'utilisateur : date réelle,
 * nom parmi les quatre fêtes, source non vide. Une erreur par ligne fautive.
 */
export function lireAjouts(valeur: unknown): { ok: true; ajouts: JourAnnonce[] } | Refus {
  if (valeur === undefined || valeur === null || valeur === '') return { ok: true, ajouts: [] }
  if (!Array.isArray(valeur)) return refus('AJOUTS_PAS_UNE_LISTE', 'Les jours annoncés doivent être une liste.', 'Announced days must be a list.')
  const ajouts: JourAnnonce[] = []
  for (const [i, brut] of valeur.entries()) {
    const ligne = brut as Partial<JourAnnonce>
    const d = lireDate(ligne?.date)
    if (!d.ok) return refus(d.code, `Jour annoncé n° ${i + 1} : ${d.erreur}`, `Announced day #${i + 1}: ${d.message}`)
    const nom = String(ligne?.nom ?? '').trim()
    const source = String(ligne?.source ?? '').trim()
    if (!nom) return refus('AJOUT_SANS_NOM', `Jour annoncé n° ${i + 1} : nom manquant.`, `Announced day #${i + 1}: name is missing.`)
    if (!source) {
      return refus(
        'AJOUT_SANS_SOURCE',
        `Jour annoncé n° ${i + 1} : source manquante. Une date annoncée se cite, elle ne se devine pas.`,
        `Announced day #${i + 1}: source is missing. An announced date is cited, never guessed.`,
      )
    }
    ajouts.push({ date: versIso(d.date), nom, source })
  }
  return { ok: true, ajouts }
}
