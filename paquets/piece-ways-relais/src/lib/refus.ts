import type { Refus } from '../coeur';

/**
 * Un refus arrête l'étape : jamais une valeur approchée à la place. Le message
 * est en français (nos instances le sont) et porte le code, que le flux peut
 * tester dans une branche d'erreur.
 */
export function echouer(r: Refus): never {
  throw new Error(`${r.erreur} [${r.code}]`);
}
