import { createAction, Property } from '@activepieces/pieces-framework';

import { PAYS, actionNumero } from '../../coeur';
import { echouer } from '../refus';

export const formatPhoneNumber = createAction({
  name: 'format_phone_number',
  displayName: 'Format Phone Number',
  description: 'Put a phone number in international format for its country, ready for WhatsApp.',
  props: {
    country: Property.StaticDropdown({
      displayName: 'Country',
      description: 'Country of the number. Never guessed: a number without its country is refused.',
      required: true,
      options: {
        disabled: false,
        options: PAYS.map((p) => ({ label: `${p.nom} (+${p.indicatif})`, value: p.code })),
      },
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'National or international form. A calling code that contradicts the country is refused.',
      required: true,
    }),
  },
  async run(context) {
    const r = actionNumero(context.propsValue.phone_number, context.propsValue.country);
    if (!r.ok) return echouer(r);
    return r.sortie;
  },
});
