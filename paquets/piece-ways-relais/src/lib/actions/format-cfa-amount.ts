import { createAction, Property } from '@activepieces/pieces-framework';

import { actionMontant } from '../../coeur';
import { echouer } from '../refus';

export const formatCfaAmount = createAction({
  name: 'format_cfa_amount',
  displayName: 'Format CFA Amount',
  description: 'Write a CFA franc amount in digits and in French words, for invoices and receipts.',
  props: {
    amount: Property.ShortText({
      displayName: 'Amount',
      description: 'Whole amount in CFA francs: 1500000, 1 500 000 or 1.500.000. Decimals and negative amounts are refused.',
      required: true,
    }),
  },
  async run(context) {
    const r = actionMontant(context.propsValue.amount);
    if (!r.ok) return echouer(r);
    return r.sortie;
  },
});
