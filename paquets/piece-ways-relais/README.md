# piece-ways-relais

West African business data for [Activepieces](https://www.activepieces.com): phone numbers by country, CFA franc amounts in digits and words, Ivorian public holidays and working days.

Made by [WAYS CI](https://ways-ci.com) in Abidjan. No connection, no external call: everything runs inside your instance. Interface in English and French.

## Actions

| Action | Output |
|---|---|
| **Format Phone Number** | `international` (`2250700000000`, the form the WhatsApp Business API expects) and `e164` (`+2250700000000`), for Côte d'Ivoire, Burkina Faso, Senegal, Mali, Togo, Benin and Niger |
| **Format CFA Amount** | `digits` (`1 500 000 FCFA`) and `words` (`un million cinq cent mille francs CFA`) |
| **Check Public Holiday** | `isHoliday`, `isWorkingDay`, the official holiday name, and `nextWorkingDay` with the days skipped |

Muslim holidays are never computed: the Ministry announces them a few days before. They live in a dated, sourced table; until a holiday of the year is announced, the answer is `subject_to_announcement`. You can add an announced date yourself, with its source.

## Refusals

The step fails rather than approximates, and the message ends with a stable code in brackets (`[PAYS_MANQUANT]`, `[MONTANT_A_VIRGULE]`, `[DATE_INEXISTANTE]`…). The full list is in the [repository](https://github.com/ways-ci/ways-relais).

## En français

Trois actions pour les entreprises de la sous-région : le numéro au format international selon le pays (le pays se choisit, il ne se devine jamais), le montant en francs CFA en chiffres et en lettres, et le jour férié ivoirien avec le prochain jour ouvré. Chaque refus dit sa raison en français.

## License

MIT
