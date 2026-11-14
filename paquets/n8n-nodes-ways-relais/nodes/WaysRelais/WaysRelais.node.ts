import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { PAYS, FETES_ANNONCEES, actionNumero, actionMontant, actionJour } from './coeur';
import type { Resultat } from './coeur';

const COUNTRY_OPTIONS: INodePropertyOptions[] = PAYS.map((p) => ({
	name: `${p.nomAnglais} (+${p.indicatif})`,
	value: p.code,
	description: `Example: ${p.exemple}`,
})).sort((a, b) => a.name.localeCompare(b.name));

// The value stays the official French name, as written in the Ministry's communiqués.
const HOLIDAY_NAMES: Record<string, string> = {
	'Lendemain de la Nuit du Destin': 'Day After the Night of Destiny (Laylat al-Qadr)',
	'Aïd el-Fitr (fin du Ramadan)': 'Eid al-Fitr (End of Ramadan)',
	'Tabaski (Aïd el-Kébir)': 'Tabaski (Eid al-Adha)',
	'Lendemain du Maouloud': 'Day After Mawlid',
};

const HOLIDAY_OPTIONS: INodePropertyOptions[] = FETES_ANNONCEES.map((f) => ({
	name: HOLIDAY_NAMES[f] ?? f,
	value: f,
})).sort(
	(a, b) => a.name.localeCompare(b.name),
);

const DEFAULT_FIELD: Record<string, string> = {
	amount: 'amount',
	phoneNumber: 'phone',
	workingDay: 'day',
};

export class WaysRelais implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WAYS Relais',
		name: 'waysRelais',
		icon: { light: 'file:waysRelais.svg', dark: 'file:waysRelais.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'West African business data: phone numbers by country, CFA franc amounts in words, Ivorian public holidays',
		defaults: {
			name: 'WAYS Relais',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Check Public Holiday',
						value: 'workingDay',
						description: "Whether a date is a public holiday in Côte d'Ivoire, and the next working day",
						action: 'Check a public holiday and the next working day',
					},
					{
						name: 'Format CFA Amount',
						value: 'amount',
						description: 'Write a CFA franc amount in digits and in French words, for invoices and receipts',
						action: 'Format a CFA franc amount',
					},
					{
						name: 'Format Phone Number',
						value: 'phoneNumber',
						description: 'Put a phone number in international format for its country, ready for WhatsApp',
						action: 'Format a phone number',
					},
				],
				default: 'phoneNumber',
			},

			// ---------------------------------------------------------------- phone number
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: COUNTRY_OPTIONS,
				default: '',
				required: true,
				description:
					'Country of the number. Never guessed: a number without its country is refused. Can be set from your data with an expression (CI, BF, SN, ML, TG, BJ, NE).',
				displayOptions: { show: { operation: ['phoneNumber'] } },
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				required: true,
				placeholder: '07 00 00 00 00',
				description: 'National or international form. A calling code that contradicts the country is refused.',
				displayOptions: { show: { operation: ['phoneNumber'] } },
			},

			// ---------------------------------------------------------------- amount
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				required: true,
				placeholder: '1 500 000',
				description:
					'Whole amount in CFA francs: 1500000, 1 500 000 or 1.500.000. Decimals and negative amounts are refused.',
				displayOptions: { show: { operation: ['amount'] } },
			},

			// ---------------------------------------------------------------- working day
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				default: '',
				required: true,
				placeholder: '2026-12-24',
				description: 'Date as 2026-12-24, 24/12/2026 or an ISO date-time. A date that does not exist is refused.',
				displayOptions: { show: { operation: ['workingDay'] } },
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				displayOptions: { show: { operation: ['workingDay'] } },
				options: [
					{
						displayName: 'Announced Days',
						name: 'announcedDays',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true },
						default: {},
						description:
							'Muslim holidays are announced by the Ministry a few days before. Add an announced date with its source until it is in the built-in table.',
						options: [
							{
								displayName: 'Day',
								name: 'day',
								values: [
									{
										displayName: 'Date',
										name: 'date',
										type: 'string',
										default: '',
										placeholder: '2027-05-16',
									},
									{
										displayName: 'Holiday',
										name: 'name',
										type: 'options',
										options: HOLIDAY_OPTIONS,
										default: 'Tabaski (Aïd el-Kébir)',
									},
									{
										displayName: 'Source',
										name: 'source',
										type: 'string',
										default: '',
										placeholder: 'Ministry communiqué of …, link',
										description: 'Where the date comes from. Required: an announced date is cited, never guessed.',
									},
								],
							},
						],
					},
					{
						displayName: 'Saturday Is a Working Day',
						name: 'saturdayIsWorkingDay',
						type: 'boolean',
						default: false,
						description: 'Whether Saturday counts as a working day (shops). Off by default (offices).',
					},
				],
			},

			// ---------------------------------------------------------------- all
			{
				displayName: 'Output Field',
				name: 'outputField',
				type: 'string',
				default: '',
				placeholder: 'phone, amount or day',
				description:
					'Field that receives the result, next to the incoming data. Empty: phone, amount or day depending on the operation.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const field =
				(this.getNodeParameter('outputField', itemIndex, '') as string).trim() || DEFAULT_FIELD[operation];

			let result: Resultat<object>;
			if (operation === 'phoneNumber') {
				result = actionNumero(
					this.getNodeParameter('phoneNumber', itemIndex, '') as string,
					this.getNodeParameter('country', itemIndex, '') as string,
				);
			} else if (operation === 'amount') {
				result = actionMontant(this.getNodeParameter('amount', itemIndex, '') as string | number);
			} else if (operation === 'workingDay') {
				const options = this.getNodeParameter('options', itemIndex, {}) as {
					saturdayIsWorkingDay?: boolean;
					announcedDays?: { day?: Array<{ date: string; name: string; source: string }> };
				};
				result = actionJour(this.getNodeParameter('date', itemIndex, '') as string, {
					saturdayIsWorkingDay: options.saturdayIsWorkingDay === true,
					announcedDays: (options.announcedDays?.day ?? []).map((d) => ({
						date: d.date,
						nom: d.name,
						source: d.source,
					})),
				});
			} else {
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex });
			}

			if (result.ok) {
				returnData.push({
					json: { ...items[itemIndex].json, [field]: result.sortie as IDataObject },
					pairedItem: { item: itemIndex },
				});
				continue;
			}

			// A refusal is never turned into an approximate value.
			if (this.continueOnFail()) {
				returnData.push({
					json: { ...items[itemIndex].json, error: result.message, errorCode: result.code },
					pairedItem: { item: itemIndex },
				});
				continue;
			}
			throw new NodeOperationError(this.getNode(), result.message, {
				itemIndex,
				description: `Refusal code: ${result.code}`,
			});
		}

		return [returnData];
	}
}
