/**
 * Les trois actions de WAYS Relais, telles que le nœud n8n et la pièce
 * Activepieces les exposent. Chaque paquet ne fait que lire ses champs et
 * appeler ces fonctions : la règle et la forme de la sortie vivent ici, une
 * seule fois, pour que les deux catalogues rendent exactement la même chose.
 *
 * Les clés de sortie sont en anglais, comme partout dans ces deux outils. Les
 * valeurs restent en français quand c'est l'objet même de l'action : le
 * montant en lettres, les noms officiels des fêtes, la date en toutes lettres.
 */
import { numeroInternational, pays } from './pays.ts'
import { montantFcfa } from './fcfa.ts'
import { lireDate, lireAjouts, jourFerie, prochainJourOuvre } from './jours.ts'
import type { Refus } from './refus.ts'

export type Resultat<T> = { ok: true; sortie: T } | Refus

// ---------------------------------------------------------------------------
// Numéro international
// ---------------------------------------------------------------------------

export interface SortieNumero {
  /** Chiffres seuls, indicatif compris : la forme attendue par l'API WhatsApp. */
  international: string
  /** Avec le « + » : la forme E.164. */
  e164: string
  country: string
  countryName: string
}

export function actionNumero(numero: unknown, codePays: unknown): Resultat<SortieNumero> {
  const r = numeroInternational(numero, codePays)
  if (!r.ok) return r
  return {
    ok: true,
    sortie: {
      international: r.international,
      e164: r.e164,
      country: r.pays,
      countryName: pays(r.pays)?.nomAnglais ?? r.pays,
    },
  }
}

// ---------------------------------------------------------------------------
// Montant FCFA
// ---------------------------------------------------------------------------

export interface SortieMontant {
  amount: number
  /** « 1 500 000 FCFA », milliers en espace insécable. */
  digits: string
  /** « un million cinq cent mille francs CFA » */
  words: string
}

export function actionMontant(valeur: unknown): Resultat<SortieMontant> {
  const r = montantFcfa(valeur)
  if (!r.ok) return r
  return { ok: true, sortie: { amount: r.montant, digits: r.chiffres, words: r.lettres } }
}

// ---------------------------------------------------------------------------
// Jour férié et prochain jour ouvré
// ---------------------------------------------------------------------------

/** « certain », ou en attente d'une fête musulmane pas encore annoncée. */
export type Certitude = 'certain' | 'subject_to_announcement'

export interface SortieJour {
  date: string
  /** « mercredi 27 mai 2026 » */
  dateWords: string
  isHoliday: boolean
  holidayName: string | null
  holidaySource: string | null
  /** Ni week-end, ni férié. Le samedi compte selon l'option choisie. */
  isWorkingDay: boolean
  certainty: Certitude
  /** Les fêtes de l'année pas encore annoncées : elles pourraient tomber ce jour-là. */
  unannouncedHolidays: string[]
  nextWorkingDay: {
    date: string
    dateWords: string
    certainty: Certitude
    unannouncedHolidays: string[]
    /** Les jours sautés pour y arriver, avec leur raison. */
    skipped: { date: string; reason: string }[]
  }
}

export interface OptionsJour {
  /** Le samedi compte-t-il comme jour ouvré ? Non par défaut (bureaux). */
  saturdayIsWorkingDay?: boolean
  /** Dates annoncées par communiqué, avec leur source, en plus de la table. */
  announcedDays?: unknown
}

function certitude(c: 'certain' | 'sous réserve'): Certitude {
  return c === 'certain' ? 'certain' : 'subject_to_announcement'
}

const RAISONS: Record<string, string> = { samedi: 'saturday', dimanche: 'sunday' }

export function actionJour(date: unknown, options: OptionsJour = {}): Resultat<SortieJour> {
  const d = lireDate(date)
  if (!d.ok) return d
  const a = lireAjouts(options.announcedDays)
  if (!a.ok) return a
  const samediOuvre = options.saturdayIsWorkingDay === true

  const f = jourFerie(d.date, a.ajouts)
  const js = new Date(Date.UTC(d.date.annee, d.date.mois - 1, d.date.jour)).getUTCDay()
  const weekEnd = js === 0 || (js === 6 && !samediOuvre)
  const suivant = prochainJourOuvre(d.date, { samediOuvre, ajouts: a.ajouts })

  return {
    ok: true,
    sortie: {
      date: f.date,
      dateWords: f.dateEnLettres,
      isHoliday: f.ferie,
      holidayName: f.nom,
      holidaySource: f.source,
      isWorkingDay: !weekEnd && !f.ferie,
      certainty: certitude(f.certitude),
      unannouncedHolidays: f.nonAnnoncees,
      nextWorkingDay: {
        date: suivant.date,
        dateWords: suivant.dateEnLettres,
        certainty: certitude(suivant.certitude),
        unannouncedHolidays: suivant.nonAnnoncees,
        skipped: suivant.sautes.map((s) => ({ date: s.date, reason: RAISONS[s.raison] ?? s.raison })),
      },
    },
  }
}
