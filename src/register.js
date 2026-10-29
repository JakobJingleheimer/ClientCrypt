import {
	b64,
	challenge,
} from './common.js';


const form = document.forms[0];

form.addEventListener('submit', async (event) => {
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

	localStorage.setItem('cred.id', b64.to(cred.rawId));
	localStorage.setItem('cred.transports', JSON.stringify(cred.response.getTransports?.() ?? []));

	location.assign('./email.html');
});
