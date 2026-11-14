/**
 * Numéros de téléphone de la sous-région, au format international.
 *
 * D'OÙ VIENT CETTE RÈGLE. Elle est reprise du référentiel des pays des
 * produits WAYS (version du 23/10/2026), écrit après une leçon coûteuse : un
 * préfixe « 225 » imposé à tout numéro fait perdre des clients étrangers, et
 * l'envoi se dit réussi. D'où les deux principes qui tiennent tout ce fichier :
 *
 * 1. LE PAYS SE DEMANDE, IL NE SE DEVINE PAS. Aucun pays par défaut : un
 *    numéro sans pays est refusé.
 * 2. ON REFUSE PLUTÔT QUE D'APPROCHER. Un numéro qui ne correspond pas à la
 *    règle de son pays rend une erreur, jamais un numéro « à peu près » : ce
 *    numéro sert aussi, ailleurs, à envoyer de l'argent.
 *
 * Une correction faite ici doit aussi être faite dans le référentiel
 * d'origine, et inversement, tant que les deux ne lisent pas le même paquet.
 */

export interface Pays {
  code: string
  nom: string
  indicatif: string
  /**
   * Le zéro national se conserve-t-il après l'indicatif ? Vrai en Côte
   * d'Ivoire (0700000000 s'écrit 2250700000000, c'est ainsi que WhatsApp
   * connaît ce numéro), faux partout ailleurs dans la zone.
   */
  zeroConserve: boolean
  /** Longueurs admises pour la partie nationale. */
  longueurs: number[]
  /** Exemple de numéro national, pour l'aide à la saisie. */
  exemple: string
}

export const PAYS: readonly Pays[] = [
  { code: 'CI', nom: "Côte d'Ivoire", indicatif: '225', zeroConserve: true, longueurs: [10], exemple: '07 00 00 00 00' },
  { code: 'BF', nom: 'Burkina Faso', indicatif: '226', zeroConserve: false, longueurs: [8], exemple: '70 00 00 00' },
  { code: 'SN', nom: 'Sénégal', indicatif: '221', zeroConserve: false, longueurs: [9], exemple: '77 000 00 00' },
  { code: 'ML', nom: 'Mali', indicatif: '223', zeroConserve: false, longueurs: [8], exemple: '70 00 00 00' },
  { code: 'TG', nom: 'Togo', indicatif: '228', zeroConserve: false, longueurs: [8], exemple: '90 00 00 00' },
  // Bénin : numéros passés à dix chiffres commençant par « 01 », et ce zéro
  // fait partie du numéro (+229 01 97 45 22 18). L'ancienne forme à huit
  // chiffres reste admise.
  { code: 'BJ', nom: 'Bénin', indicatif: '229', zeroConserve: false, longueurs: [8, 10], exemple: '01 90 00 00 00' },
  { code: 'NE', nom: 'Niger', indicatif: '227', zeroConserve: false, longueurs: [8], exemple: '90 00 00 00' },
]

export function pays(code: string | null | undefined): Pays | undefined {
  if (!code) return undefined
  return PAYS.find((p) => p.code === code.trim().toUpperCase())
}

export type ResultatNumero =
  | {
      ok: true
      /** Chiffres seuls, indicatif compris, sans « + » : la forme attendue par l'API WhatsApp. */
      international: string
      /** Avec le « + » : la forme E.164. */
      e164: string
      pays: string
      nomPays: string
    }
  | { ok: false; erreur: string }

/**
 * Met un numéro en écriture internationale selon le pays donné.
 *
 * Accepte la forme nationale (« 07 00 00 00 00 ») comme la forme
 * internationale (« +225 07 00 00 00 00 », « 00225… »), à condition que
 * l'indicatif écrit soit bien celui du pays annoncé.
 */
export function numeroInternational(numero: unknown, codePays: unknown): ResultatNumero {
  if (codePays === null || codePays === undefined || String(codePays).trim() === '') {
    return { ok: false, erreur: 'Pays manquant : le pays se choisit, il ne se devine pas.' }
  }
  const p = pays(String(codePays))
  if (!p) {
    const connus = PAYS.map((x) => x.code).join(', ')
    return { ok: false, erreur: `Pays « ${String(codePays)} » inconnu. Pays pris en charge : ${connus}.` }
  }

  const brut = numero === null || numero === undefined ? '' : String(numero).trim()
  let n = brut.replace(/\D/g, '')
  if (!n) return { ok: false, erreur: 'Numéro vide.' }

  const ecritInternational = brut.startsWith('+') || n.startsWith('00')
  if (n.startsWith('00')) n = n.slice(2)

  if (ecritInternational) {
    if (!n.startsWith(p.indicatif)) {
      return {
        ok: false,
        erreur: `Le numéro porte un autre indicatif que celui du pays choisi (${p.nom}, +${p.indicatif}).`,
      }
    }
    n = n.slice(p.indicatif.length)
  } else if (n.startsWith(p.indicatif) && n.length > Math.max(...p.longueurs)) {
    // Indicatif écrit sans « + » : on le retire seulement si ce qui reste est
    // plus long qu'un numéro national, pour ne jamais rogner un vrai numéro.
    n = n.slice(p.indicatif.length)
  }

  const national = normaliserNational(n, p)
  if (national === null) {
    return {
      ok: false,
      erreur: `Ce numéro ne correspond pas au format ${p.nom} (exemple : ${p.exemple}).`,
    }
  }
  const international = `${p.indicatif}${national}`
  return { ok: true, international, e164: `+${international}`, pays: p.code, nomPays: p.nom }
}

/**
 * La partie nationale telle qu'elle doit suivre l'indicatif, ou `null`.
 *
 * Le zéro saisi par habitude est retiré AVANT de concaténer, et pas seulement
 * pendant la validation : sinon un numéro passe la validation puis ressort
 * avec son zéro, un numéro qui n'existe pas.
 */
function normaliserNational(n: string, p: Pays): string | null {
  if (p.zeroConserve) {
    // Côte d'Ivoire : dix chiffres commençant par zéro, et ce zéro reste.
    return p.longueurs.includes(n.length) && n.startsWith('0') ? n : null
  }
  // Une longueur déjà admise (le Bénin à dix chiffres, « 01 » compris) se garde.
  if (p.longueurs.includes(n.length)) return n
  const sansZero = n.replace(/^0+/, '')
  return sansZero !== n && p.longueurs.includes(sansZero.length) ? sansZero : null
}
