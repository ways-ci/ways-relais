/**
 * La forme commune d'un refus.
 *
 * - `code` : stable, à tester dans un flux (« si code = MONTANT_A_VIRGULE… »).
 * - `erreur` : la raison en français, telle qu'on la montre à l'utilisateur.
 * - `message` : la même raison en anglais. Le catalogue de n8n n'admet que
 *   l'anglais dans un nœud vérifié, messages d'erreur compris.
 *
 * Les deux textes disent la même chose : on corrige l'un, on corrige l'autre.
 */
export interface Refus {
  ok: false
  code: string
  erreur: string
  message: string
}

export function refus(code: string, erreur: string, message: string): Refus {
  return { ok: false, code, erreur, message }
}
