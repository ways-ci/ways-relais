# WAYS Relais : Afrique de l'Ouest

Trois actions pour n8n et Activepieces, pensées pour les entreprises de la sous-région.

| Action | Ce qu'elle rend | Ce qu'elle refuse |
|---|---|---|
| **Numéro international** | `2250700000000` et `+2250700000000` à partir de `07 00 00 00 00` et du pays | un numéro sans pays, un indicatif qui contredit le pays, une longueur fausse |
| **Montant FCFA** | `1 500 000 FCFA` et « un million cinq cent mille francs CFA » | un montant à virgule (le franc CFA n'a pas de centimes), négatif, ou au-delà de 999 milliards |
| **Jour férié et jour ouvré** | si un jour est férié en Côte d'Ivoire, et le prochain jour ouvré | une date qui n'existe pas (29 février 2027, 31 avril) |

**Le guide d'utilisation en français : [docs/aide.md](docs/aide.md).**

Pays pris en charge : Côte d'Ivoire, Burkina Faso, Sénégal, Mali, Togo, Bénin, Niger.

## Trois règles

1. **Le pays se choisit, il ne se devine pas.** Aucun pays par défaut.
2. **On refuse plutôt que d'approcher.** Chaque refus dit sa raison, en français.
3. **Les fêtes musulmanes ne se calculent pas, elles s'annoncent.** Le ministère
   de l'Emploi les fixe par communiqué, quelques jours avant. Elles vivent dans
   une table datée et sourcée ; vous pouvez y ajouter une date annoncée, avec sa
   source. Tant qu'une fête de l'année n'est pas annoncée, la réponse est
   « sous réserve », jamais « ouvré » tout court.

Fêtes fixes et fêtes chrétiennes mobiles : décret n° 96-205 du 7 mars 1996,
modifié par le décret n° 2011-371 du 4 novembre 2011. Le jour de plus quand une
fête tombe un dimanche n'est pas encore appliqué : il le sera après lecture du
texte officiel. D'ici là, un jour de remplacement annoncé s'ajoute à la table.

## État

- [x] Le cœur commun (`coeur/`), sans aucune dépendance, et ses contrôles
- [x] Le nœud n8n (`paquets/n8n-nodes-ways-relais`) : linter du catalogue passé, essayé dans n8n 2.47.7
- [x] La pièce Activepieces (`paquets/piece-ways-relais`) : installée et exécutée dans Activepieces 0.93.0, en français
- [x] Le guide en français (`docs/aide.md`)
- [ ] Publication sur npm (flux `.github/workflows/publier.yml`, provenance)
- [ ] Demande de vérification chez n8n

## Comment c'est rangé

| Dossier | Contenu |
|---|---|
| `coeur/` | La règle, une seule fois : pays, montants, jours, et les trois actions communes (`actions.ts`) |
| `paquets/n8n-nodes-ways-relais/` | Le nœud n8n. Interface et messages en anglais : n8n n'admet que l'anglais dans un nœud vérifié |
| `paquets/piece-ways-relais/` | La pièce Activepieces. Anglais de base, traduction française dans `src/i18n/fr.json` |
| `outils/` | La copie du cœur dans chaque paquet avant son build, et l'empaquetage de la pièce |

Chaque refus porte un `code` stable, sa raison en français (`erreur`) et en anglais (`message`).

## Contrôles

Le cœur : Node.js 22.18 ou plus récent, rien à installer.

```
npm test
```

Les paquets installent leurs outils (`npm install` dans chaque dossier de `paquets/`) : à faire dans un
Codespace, jamais sur un poste qui porte des clés de production. Le contrôle continu GitHub
(`.github/workflows/ci.yml`) rejoue le cœur, le build et le linter des deux paquets à chaque PR.

## Licence

MIT
