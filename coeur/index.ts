/**
 * WAYS Relais : Afrique de l'Ouest. Le cœur commun, sans aucune dépendance,
 * que le nœud n8n et la pièce Activepieces appellent tous deux : la règle vit
 * ici, une seule fois.
 */
export { PAYS, pays, numeroInternational } from './pays.ts'
export type { Pays, ResultatNumero } from './pays.ts'
export { MONTANT_MAX, lireMontant, enChiffres, enLettres, nombreEnLettres, montantFcfa } from './fcfa.ts'
export type { ResultatMontant } from './fcfa.ts'
export {
  FETES_ANNONCEES,
  JOURS_ANNONCES,
  ANNEE_MIN,
  ANNEE_MAX,
  lireDate,
  lireAjouts,
  versIso,
  enToutesLettres,
  paques,
  feriesCalcules,
  fetesNonAnnoncees,
  jourFerie,
  prochainJourOuvre,
} from './jours.ts'
export type { DateSimple, JourAnnonce, ReponseFerie, ReponseOuvre, OptionsOuvre } from './jours.ts'
