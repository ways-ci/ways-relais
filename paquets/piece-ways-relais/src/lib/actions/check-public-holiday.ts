import { createAction, Property } from '@activepieces/pieces-framework';

import { FETES_ANNONCEES, actionJour } from '../../coeur';
import { echouer } from '../refus';

export const checkPublicHoliday = createAction({
  name: 'check_public_holiday',
  displayName: 'Check Public Holiday',
  description: "Whether a date is a public holiday in Côte d'Ivoire, and the next working day.",
  props: {
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date as 2026-12-24, 24/12/2026 or an ISO date-time. A date that does not exist is refused.',
      required: true,
    }),
    saturday_is_working_day: Property.Checkbox({
      displayName: 'Saturday Is a Working Day',
      description: 'Whether Saturday counts as a working day (shops). Off by default (offices).',
      required: false,
      defaultValue: false,
    }),
    announced_days: Property.Array({
      displayName: 'Announced Days',
      description:
        'Muslim holidays are announced by the Ministry a few days before. Add an announced date with its source until it is in the built-in table.',
      required: false,
      properties: {
        date: Property.ShortText({ displayName: 'Date', required: true }),
        name: Property.StaticDropdown({
          displayName: 'Holiday',
          required: true,
          options: { disabled: false, options: FETES_ANNONCEES.map((f) => ({ label: f, value: f })) },
        }),
        source: Property.ShortText({
          displayName: 'Source',
          description: 'Where the date comes from. Required: an announced date is cited, never guessed.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const jours = (context.propsValue.announced_days ?? []) as Array<{ date?: string; name?: string; source?: string }>;
    const r = actionJour(context.propsValue.date, {
      saturdayIsWorkingDay: context.propsValue.saturday_is_working_day === true,
      announcedDays: jours.map((j) => ({ date: j.date, nom: j.name, source: j.source })),
    });
    if (!r.ok) return echouer(r);
    return r.sortie;
  },
});
