import {
	b64,
	challenge,
	db,
	decrypt,
	encoder,
	encrypt,
	identify,
	salt,
} from './common.js';


const rawId = localStorage.getItem('cred.id');

if (!rawId) location.assign('/index.html');

const credId = b64.from(rawId);
const transports = JSON.parse(localStorage.getItem('cred.transports'));

const assertion = await navigator.credentials.get({
	publicKey: {
		allowCredentials: credId
			? [{ id: credId, transports, type: 'public-key' }]
			: [],
		challenge,
		extensions: { prf: { eval: { first: salt } } },
		hints: ['client-device'],
		rpId: location.hostname,
		userVerification: 'required',
	},
});

const prf = assertion.getClientExtensionResults().prf?.results?.first;

if (!prf) throw new Error('PRF not supported');

const algo = 'HKDF';
const ingredients = await crypto.subtle.importKey(
	'raw',
	prf,
	algo,
	false,
	['deriveKey'],
);

const key = await crypto.subtle.deriveKey(
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
);

const form = document.forms[0];

onLoad();

form.addEventListener('reset', onReset);
form.addEventListener('submit', onSubmit);

async function onLoad() {
	const id = (new URLSearchParams(location.search)).get('id');

	if (!id) return;

	const record = await (await db).get('emails', id);

	if (!record) return alert(`Draft ${id} not found!`);

	const draft = await decrypt(key, record.contents, record.iv);

	for (const [name, value] of Object.entries(draft)) form.elements[name].value = value;
}

async function onReset(event) {
	const id = (new URLSearchParams(location.search)).get('id');

	if (!id) return;

	(await db).delete('emails', id);

	const url = new URL(location.href);
	url.searchParams.delete('id');
	history.pushState(undefined, undefined, url);
}

async function onSubmit(event) {
	event.preventDefault();

	const data = {};
	for (const { name, value } of event.currentTarget.elements) if (name) data[name] = value;

	const { encrypted, iv } = await encrypt(key, data);

	const id = identify();
	(await db).put('emails', {
		box: 'draft',
		contents: encrypted,
		date: new Date(),
		iv,
	}, id);

	const url = new URL(location.href);
	url.searchParams.set('id', id);
	history.pushState(undefined, undefined, url);
}
