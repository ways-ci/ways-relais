# WAYS Relais : le guide en français

WAYS Relais ajoute à n8n et à Activepieces trois actions pensées pour les entreprises d'Afrique de l'Ouest :

1. **mettre un numéro au format international**, selon le pays du client ;
2. **écrire un montant en francs CFA**, en chiffres et en lettres ;
3. **savoir si un jour est férié en Côte d'Ivoire**, et quel est le prochain jour ouvré.

Tout se calcule dans votre outil : aucune connexion à créer, aucun compte, aucun appel vers l'extérieur.

---

## Un exemple pour commencer

WAYS CI relance chaque matin les factures qui arrivent à échéance. Pour chaque facture, le flux :

1. lit le numéro du client et son pays, et le met au format attendu par WhatsApp (`2250700000000`) ;
2. écrit le montant dû en lettres pour le message : « un million cinq cent mille francs CFA » ;
3. vérifie la date d'échéance : si elle tombe un jour férié ou un week-end, la relance part le prochain jour ouvré.

Trois étapes, et plus aucun message envoyé le jour de Noël, ni de numéro à qui il manque l'indicatif.

---

## Installer

### Dans n8n (installation auto-hébergée)

1. Ouvrez **Settings**, puis **Community Nodes**.
2. Cliquez sur **Install**, saisissez `n8n-nodes-ways-relais`, cochez la case de confirmation, puis **Install**.
3. Le nœud **WAYS Relais** apparaît dans la liste des nœuds.

L'interface du nœud est en anglais : c'est la règle de n8n pour les nœuds de sa communauté. Les résultats, eux, restent en français là où il le faut (montant en lettres, noms des fêtes, dates).

### Dans Activepieces

L'administrateur de la plateforme installe la pièce une fois pour tous :

1. Ouvrez les réglages de la plateforme, puis **Pièces**.
2. Choisissez **Installer une pièce**, source **npm**, nom `piece-ways-relais`, et la dernière version.

La pièce s'affiche en français si votre Activepieces est réglé en français.

Dans l'édition libre d'Activepieces, ce bouton est masqué, mais l'installation reste permise par l'API de la plateforme :

```
curl -X POST https://VOTRE-INSTANCE/api/v1/pieces \
  -H "Authorization: Bearer JETON_ADMINISTRATEUR" \
  -F packageType=REGISTRY -F scope=PLATFORM \
  -F pieceName=piece-ways-relais -F pieceVersion=VERSION
```

---

## Les trois actions

### 1. Numéro international

| Vous donnez | Vous obtenez |
|---|---|
| le **pays** (choisi dans la liste, ou lu dans vos données : `CI`, `BF`, `SN`, `ML`, `TG`, `BJ`, `NE`) | `international` : chiffres seuls, indicatif compris, la forme attendue par l'API WhatsApp |
| le **numéro**, sous sa forme nationale (`07 00 00 00 00`) ou internationale (`+225 07 00 00 00 00`) | `e164` : la même chose avec le `+` |

Ce qu'il faut savoir :

- **Le pays se choisit, il ne se devine jamais.** Un numéro sans pays est refusé : aucun numéro n'est supposé ivoirien.
- En Côte d'Ivoire, le zéro reste après l'indicatif (`2250700000000`) ; partout ailleurs, il tombe.
- Au Bénin, les numéros à dix chiffres commençant par `01` sont reconnus, comme l'ancienne forme à huit chiffres.
- Un numéro écrit avec l'indicatif d'un autre pays que celui choisi est refusé.

### 2. Montant FCFA

| Vous donnez | Vous obtenez |
|---|---|
| un montant entier : `1500000`, `1 500 000` ou `1.500.000` | `digits` : `1 500 000 FCFA` |
| | `words` : `un million cinq cent mille francs CFA` |

Ce qu'il faut savoir :

- Le franc CFA n'a pas de centimes : **un montant à virgule est refusé**, jamais arrondi.
- Les milliers sont séparés par une espace insécable : le montant ne se coupe jamais en fin de ligne dans un reçu.
- Les lettres suivent l'orthographe traditionnelle (« deux cent mille », « deux millions de francs CFA »).
- Jusqu'à 999 milliards.

### 3. Jour férié et prochain jour ouvré

| Vous donnez | Vous obtenez |
|---|---|
| une **date** : `2026-12-24`, `24/12/2026` ou une date-heure | `isHoliday` : la date est-elle fériée, avec `holidayName` et `holidaySource` |
| | `isWorkingDay` : ni week-end, ni férié |
| | `nextWorkingDay` : le prochain jour ouvré, avec les jours sautés et leur raison |
| | `certainty` : `certain`, ou `subject_to_announcement` (voir plus bas) |

Deux options :

- **Le samedi est ouvré** : désactivé par défaut (bureaux), à activer pour un commerce.
- **Jours annoncés** : pour ajouter une fête annoncée par communiqué, avec sa source.

Exemple : le jeudi 24 décembre 2026, le prochain jour ouvré est le **lundi 28 décembre** (Noël le vendredi, puis le week-end).

#### Les fêtes musulmanes

Les fêtes fixes (1er janvier, 1er mai, 7 août, 15 août, 1er novembre, 15 novembre, 25 décembre) et les fêtes chrétiennes mobiles (lundi de Pâques, Ascension, lundi de Pentecôte) se calculent : décret n° 96-205 du 7 mars 1996, modifié par le décret n° 2011-371 du 4 novembre 2011.

**Les fêtes musulmanes ne se calculent pas.** Le ministère de l'Emploi en fixe la date par communiqué, quelques jours avant. WAYS Relais les garde dans une table datée et sourcée, que nous complétons à chaque communiqué.

Tant qu'une fête de l'année n'est pas annoncée, un jour ordinaire de cette année reçoit la réponse `subject_to_announcement` (« sous réserve »), et la liste des fêtes qui manquent. Ce n'est pas une erreur : c'est la vérité du calendrier.

Le communiqué est sorti et la mise à jour n'est pas encore là ? Ajoutez la date dans **Jours annoncés**, avec sa source (le communiqué, ou l'article qui le relaie, et son adresse). Une date sans source est refusée.

#### Ce qui n'est pas encore pris en compte

Le jour de repos supplémentaire accordé quand une fête tombe un dimanche n'est pas encore calculé : il le sera après lecture du texte officiel. D'ici là, quand le gouvernement annonce un jour de remplacement, ajoutez-le dans **Jours annoncés**.

---

## Quand une action refuse

WAYS Relais refuse plutôt que d'approcher : un numéro deviné ou un montant arrondi coûte plus cher qu'une étape arrêtée. Chaque refus porte un **code** stable, que vous pouvez tester dans une branche d'erreur de votre flux.

| Code | Ce qui s'est passé | Que faire |
|---|---|---|
| `PAYS_MANQUANT` | aucun pays donné | renseigner le pays du client dans vos données |
| `PAYS_INCONNU` | pays hors de la liste | vérifier le code pays (`CI`, `BF`, `SN`, `ML`, `TG`, `BJ`, `NE`) |
| `INDICATIF_CONTREDIT` | l'indicatif écrit ne correspond pas au pays choisi | corriger le pays ou le numéro |
| `FORMAT_NUMERO` | longueur ou forme fausse pour ce pays | vérifier le numéro auprès du client |
| `NUMERO_VIDE` | numéro vide | |
| `MONTANT_A_VIRGULE` | montant avec des décimales | arrondir en amont, en connaissance de cause |
| `MONTANT_NEGATIF`, `MONTANT_TROP_GRAND`, `MONTANT_MANQUANT`, `MONTANT_ILLISIBLE` | autres montants refusés | |
| `DATE_INEXISTANTE` | une date qui n'existe pas (29 février 2027, 31 avril) | corriger la date |
| `DATE_MANQUANTE`, `DATE_ILLISIBLE`, `ANNEE_HORS_CALENDRIER` | autres dates refusées | |
| `AJOUT_SANS_SOURCE`, `AJOUT_SANS_NOM`, `AJOUTS_PAS_UNE_LISTE` | un jour annoncé incomplet | donner la source et le nom de la fête |

- **Dans n8n**, activez **Settings > On Error > Continue** sur le nœud : l'élément refusé continue avec les champs `error` (en anglais) et `errorCode`.
- **Dans Activepieces**, le message d'échec est en français et se termine par le code entre crochets, par exemple : « Montant à virgule refusé : le franc CFA n'a pas de centimes. [MONTANT_A_VIRGULE] ».

---

## Une question, une date à ajouter, un pays à couvrir

Ouvrez une demande sur le dépôt : <https://github.com/ways-ci/ways-relais/issues>.

WAYS Relais est fait à Abidjan par [WAYS CI](https://ways-ci.com), sous licence MIT.
