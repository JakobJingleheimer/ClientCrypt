import type { SubmitEventHandler, TargetedSubmitEvent } from 'preact';

import {
	challenge,
} from '../common.ts';
import type { Crypt } from '../useCrypt.ts';


type RegistrationFormFields = {
	displayName: HTMLInputElement & { name: 'displayName' },
	email: HTMLInputElement & { name: 'email' },
};
type RegistrationFormElements = RegistrationFormFields & Iterable<RegistrationFormFields[keyof RegistrationFormFields]>;

export type SubmitRegistrationTarget = HTMLFormElement & { elements: RegistrationFormElements };

export type SubmitRegistrationHandler = SubmitEventHandler<SubmitRegistrationTarget>;

export const handleRegister = async (
	event: TargetedSubmitEvent<SubmitRegistrationTarget>,
	crypt: Crypt,
) => {
	event.preventDefault();

	const {
		displayName: { value: displayName },
		email: { value: email },
	} = event.currentTarget.elements;

	const cred = await navigator.credentials.create({
		publicKey: {
			authenticatorSelection: {
				authenticatorAttachment: 'platform',
				residentKey: 'required',
				userVerification: 'required',
			},
			challenge,
			extensions: { prf: {} },
			pubKeyCredParams: [
				{ type: 'public-key', alg:   -7 /* ES256 */ },
				{ type: 'public-key', alg: -257 /* RS256 */ },
			],
			rp: {
				id: location.hostname,
				name: 'Client Crypt',
			},
			user: {
				displayName,
				id: new Uint8Array(16),
				name: email,
			},
		},
	});

	if (!cred) throw new Error('Could not generate credential');

	crypt.credId = cred.rawId;
	crypt.credTransports = cred.response.getTransports?.();
}
