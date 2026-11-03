import { useRef } from 'preact/hooks';

import {
	b64,
	challenge,
	encoder,
	salt,
} from './common.ts';


const algo = 'HKDF';

export function useCrypt() {
	const credId = useRef(
		((rawId) => rawId ? b64.from(rawId) : undefined)(localStorage.getItem('cred.id'))
	);
	const credTransports = useRef(
		((rawTransports) => (rawTransports
			? JSON.parse(rawTransports)
			: []
		) as AuthenticatorTransport[])(localStorage.getItem('cred.transports'))
	);
	const key = useRef<Promise<CryptoKey>>(undefined);

	return {
		get credId() {
			if (credId.current) return credId.current;

			const stored = localStorage.getItem('cred.id');
			if (stored) return credId.current = b64.from(stored);
		},
		set credId(val: Uint8Array<ArrayBuffer>) {
			if (!val) throw new TypeError('Invalid credential id');

			localStorage.setItem('cred.id', b64.to(val));
			credId.current = val;
		},
		set credTransports(val: AuthenticatorTransport[]) {
			if (!val) throw new TypeError('Invalid credential transports');

			localStorage.setItem('cred.transports', JSON.stringify(val));
			credTransports.current = val;
		},
		get key() {
			if (key.current) return key.current;

			if (!credId.current) return key.current = Promise.resolve(null);

			// return (navigator.credentials.get({
			return key.current = (navigator.credentials.get({
				publicKey: {
					allowCredentials: credId
						? [{
								id: credId.current,
								transports: credTransports.current,
								type: 'public-key',
							}]
						: [],
					challenge,
					extensions: { prf: { eval: { first: salt } } },
					hints: ['client-device'],
					rpId: location.hostname,
					userVerification: 'required',
				},
			}) as Promise<PublicKeyCredential | null>)
			.then(deriveKeyFromCredential)
			// .then((k) => key.current = k);
		},
	};
}

export type Crypt = ReturnType<typeof useCrypt>;

function deriveKeyFromCredential(cred: PublicKeyCredential | null) {
	const prf = cred?.getClientExtensionResults().prf?.results?.first;

	if (!prf) throw new Error('PRF not supported');

	return crypto.subtle.importKey(
		'raw',
		prf,
		algo,
		false,
		['deriveKey'],
	)
		.then((ingredients) => crypto.subtle.deriveKey(
			{
				name: algo,
				hash: 'SHA-256',
				salt: new Uint8Array(),
				info: encoder.encode('aes-gcm-encrypt'),
			},
			ingredients,
			{ name: 'AES-GCM', length: 256 },
			false,
			['decrypt', 'encrypt'],
		));
};
