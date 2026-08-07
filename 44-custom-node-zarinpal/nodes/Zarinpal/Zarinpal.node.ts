import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// Zarinpal IPG v4 error code dictionary
const ZARINPAL_ERROR_CODES: { [key: number]: string } = {
	[-9]: 'Validation error: check merchant_id, amount, and callback_url.',
	[-10]: 'Merchant not found or inactive.',
	[-11]: 'Merchant is inactive. Contact Zarinpal support.',
	[-12]: 'Amount is invalid or below the minimum.',
	[-15]: 'Payment already verified and cannot be verified again.',
	[-16]: 'Payment was not successful.',
	[-22]: 'Payment is not in a verifiable state (canceled).',
	[-30]: 'Transaction amount does not match the original request.',
	[-50]: 'Internal Zarinpal error. Retry later.',
	[-54]: 'Payment is archived.',
};

export class Zarinpal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zarinpal',
		name: 'zarinpal',
		icon: 'file:zarinpal.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with Zarinpal Iranian payment gateway (IPG v4)',
		defaults: {
			name: 'Zarinpal',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'zarinpalApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Payment',
						value: 'createPayment',
						description: 'Request a new payment and get Authority',
						action: 'Create a payment request',
					},
					{
						name: 'Verify Payment',
						value: 'verifyPayment',
						description: 'Verify a successful payment',
						action: 'Verify a payment',
					},
					{
						name: 'Get Unverified Payments',
						value: 'getUnverified',
						description: 'List payments awaiting verification',
						action: 'Get unverified payments',
					},
				],
				default: 'createPayment',
			},
			{
				displayName: 'Amount (Toman)',
				name: 'amount',
				type: 'number',
				default: 1000,
				required: true,
				displayOptions: { show: { operation: ['createPayment'] } },
				description: 'Payment amount in Toman (minimum 100)',
			},
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['createPayment'] } },
				description: 'URL the user is redirected to after payment',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['createPayment'] } },
			},
			{
				displayName: 'Return Start Pay URL',
				name: 'returnStartPayUrl',
				type: 'boolean',
				default: true,
				displayOptions: { show: { operation: ['createPayment'] } },
				description: 'Whether to include the full StartPay redirect URL in the output',
			},
			{
				displayName: 'Authority',
				name: 'authority',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['verifyPayment'] } },
				description: 'Authority code returned by Create Payment',
			},
			{
				displayName: 'Amount (Toman)',
				name: 'verifyAmount',
				type: 'number',
				default: 1000,
				required: true,
				displayOptions: { show: { operation: ['verifyPayment'] } },
				description: 'Must match the original request amount',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('zarinpalApi');
		const merchantId = credentials.merchantId as string;
		const environment = credentials.environment as string;

		const baseUrl =
			environment === 'sandbox'
				? 'https://sandbox.zarinpal.com/pg/v4/payment'
				: 'https://api.zarinpal.com/pg/v4/payment';

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			try {
				if (operation === 'createPayment') {
					const amount = this.getNodeParameter('amount', i) as number;
					const callbackUrl = this.getNodeParameter('callbackUrl', i) as string;
					const description = this.getNodeParameter('description', i, '') as string;
					const returnStartPayUrl = this.getNodeParameter('returnStartPayUrl', i, true) as boolean;

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/request.json`,
						body: {
							merchant_id: merchantId,
							amount,
							callback_url: callbackUrl,
							description,
						},
						json: true,
					});

					if (response.errors) {
						throw new NodeOperationError(
							this.getNode(),
							`Zarinpal error ${response.errors.code}: ${ZARINPAL_ERROR_CODES[response.errors.code] || 'Unknown error'}`,
						);
					}

					const authority = response.data.authority as string;
					const output: { [key: string]: unknown } = {
						authority,
						code: response.data.code,
						fee: response.data.fee,
						expiryTime: response.data.expiry_time,
					};

					if (returnStartPayUrl) {
						output.startPayUrl = `https://www.zarinpal.com/pg/StartPay/${authority}`;
						output.sandboxStartPayUrl = `https://sandbox.zarinpal.com/pg/StartPay/${authority}/ZarinGate`;
					}

					returnData.push({ json: output });
				}

				if (operation === 'verifyPayment') {
					const authority = this.getNodeParameter('authority', i) as string;
					const amount = this.getNodeParameter('verifyAmount', i) as number;

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/verify.json`,
						body: {
							merchant_id: merchantId,
							authority,
							amount,
						},
						json: true,
					});

					if (response.errors) {
						throw new NodeOperationError(
							this.getNode(),
							`Zarinpal error ${response.errors.code}: ${ZARINPAL_ERROR_CODES[response.errors.code] || 'Unknown error'}`,
						);
					}

					returnData.push({
						json: {
							verified: response.data.code === 100,
							refId: response.data.ref_id,
							code: response.data.code,
							cardPan: response.data.card_pan,
							cardHash: response.data.card_hash,
							fee: response.data.fee,
						},
					});
				}

				if (operation === 'getUnverified') {
					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/unverified.json`,
						body: { merchant_id: merchantId },
						json: true,
					});

					if (response.errors) {
						throw new NodeOperationError(
							this.getNode(),
							`Zarinpal error ${response.errors.code}: ${ZARINPAL_ERROR_CODES[response.errors.code] || 'Unknown error'}`,
						);
					}

					const payments = (response.data || []).map((p: { [key: string]: unknown }) => ({
						authority: p.authority,
						amount: p.amount,
						date: p.date,
					}));

					returnData.push({ json: { count: payments.length, payments } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}