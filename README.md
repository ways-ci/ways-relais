# WAYS Relais : Afrique de l'Ouest

Trois actions pour n8n et Activepieces, pensées pour les entreprises de la sous-région.

| Action | Ce qu'elle rend | Ce qu'elle refuse |
|---|---|---|
| **Numéro international** | `2250700000000` et `+2250700000000` à partir de `07 00 00 00 00` et du pays | un numéro sans pays, un indicatif qui contredit le pays, une longueur fausse |
| **Montant FCFA** | `1 500 000 FCFA` et « un million cinq cent mille francs CFA » | un montant à virgule (le franc CFA n'a pas de centimes), négatif, ou au-delà de 999 milliards |
| **Jour férié et jour ouvré** | si un jour est férié en Côte d'Ivoire, et le prochain jour ouvré | une date qui n'existe pas (29 février 2027, 31 avril) |

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
- [ ] Le nœud n8n
- [ ] La pièce Activepieces
- [ ] Publication

## Contrôles

Node.js 22.18 ou plus récent, rien à installer :

```
npm test
```

## Licence

MIT
