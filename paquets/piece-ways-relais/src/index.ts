import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { formatPhoneNumber } from './lib/actions/format-phone-number';
import { formatCfaAmount } from './lib/actions/format-cfa-amount';
import { checkPublicHoliday } from './lib/actions/check-public-holiday';

export const waysRelais = createPiece({
  displayName: 'WAYS Relais',
  description:
    'West African business data: phone numbers by country, CFA franc amounts in words, Ivorian public holidays and working days.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://raw.githubusercontent.com/ways-ci/ways-relais/main/paquets/piece-ways-relais/logo.svg',
  authors: ['ways-ci'],
  actions: [formatPhoneNumber, formatCfaAmount, checkPublicHoliday],
  triggers: [],
});
