# n8n-nodes-ways-relais

West African business data for [n8n](https://n8n.io): phone numbers by country, CFA franc amounts in digits and words, Ivorian public holidays and working days.

Made by [WAYS CI](https://ways-ci.com) in Abidjan, for teams that automate invoices, reminders and WhatsApp messages in the region.

No credentials, no external call, no runtime dependency: everything runs inside your n8n.

Full guide in French: [docs/aide.md](https://github.com/ways-ci/ways-relais/blob/main/docs/aide.md).

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) and install `n8n-nodes-ways-relais`.

## Operations

### Format Phone Number

Puts a number in international format for its country.

| Input | Country | Output `international` | Output `e164` |
|---|---|---|---|
| `07 00 00 00 00` | Côte d'Ivoire | `2250700000000` | `+2250700000000` |
| `77 000 00 00` | Senegal | `221770000000` | `+221770000000` |
| `+225 07 00 00 00 00` | Côte d'Ivoire | `2250700000000` | `+2250700000000` |

The `international` form (digits only) is what the WhatsApp Business API expects.

Supported countries: Côte d'Ivoire, Burkina Faso, Senegal, Mali, Togo, Benin, Niger. In Côte d'Ivoire the leading zero is kept after the calling code; everywhere else it is dropped.

### Format CFA Amount

Writes a whole CFA franc amount in digits and in French words, as required on invoices and receipts.

```json
{ "amount": 1500000, "digits": "1 500 000 FCFA", "words": "un million cinq cent mille francs CFA" }
```

Accepts `1500000`, `1 500 000` and `1.500.000`. Thousands use a non-breaking space so an amount never breaks across lines.

### Check Public Holiday

Tells whether a date is a public holiday in Côte d'Ivoire, and gives the next working day.

```json
{
  "date": "2026-12-24",
  "dateWords": "jeudi 24 décembre 2026",
  "isHoliday": false,
  "isWorkingDay": true,
  "certainty": "certain",
  "nextWorkingDay": {
    "date": "2026-12-28",
    "skipped": [
      { "date": "2026-12-25", "reason": "Noël" },
      { "date": "2026-12-26", "reason": "saturday" },
      { "date": "2026-12-27", "reason": "sunday" }
    ]
  }
}
```

Options: **Saturday Is a Working Day** (off by default, for offices), and **Announced Days**.

Fixed holidays and Christian movable holidays are computed (decree no. 96-205 of 7 March 1996, amended by decree no. 2011-371 of 4 November 2011). **Muslim holidays are never computed**: the Ministry announces them by communiqué a few days before. They live in a dated, sourced table. Until a holiday of the year is announced, the answer is `subject_to_announcement`, never plain `certain`. You can add an announced date yourself, with its source, in **Announced Days**.

## Refusals

The node refuses rather than approximates. Each refusal has a stable code you can branch on with **Continue On Fail** (fields `error` and `errorCode`):

| Code | When |
|---|---|
| `PAYS_MANQUANT` | no country given (a number is never assumed to be Ivorian) |
| `PAYS_INCONNU` | country outside the supported list |
| `INDICATIF_CONTREDIT` | the number's calling code contradicts the chosen country |
| `FORMAT_NUMERO` | wrong length or form for that country |
| `NUMERO_VIDE` | empty number |
| `MONTANT_A_VIRGULE` | decimal amount (the CFA franc has no cents) |
| `MONTANT_NEGATIF`, `MONTANT_TROP_GRAND`, `MONTANT_MANQUANT`, `MONTANT_ILLISIBLE` | other amount refusals |
| `DATE_INEXISTANTE` | a date that does not exist (29 February 2027, 31 April) |
| `DATE_MANQUANTE`, `DATE_ILLISIBLE`, `ANNEE_HORS_CALENDRIER` | other date refusals |
| `AJOUT_SANS_SOURCE`, `AJOUT_SANS_NOM`, `AJOUTS_PAS_UNE_LISTE` | an announced day without its source or name |

## Output field

The result is written next to the incoming data, in the field named by **Output Field** (`phone`, `amount` or `day` by default).

## Compatibility

Built and tested with n8n 2.x (`n8nNodesApiVersion` 1).

## License

[MIT](https://github.com/ways-ci/ways-relais/blob/main/LICENSE)
