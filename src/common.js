import { openDB } from './idb.js';


export const decoder = new TextDecoder();
export const encoder = new TextEncoder();

export const challenge = crypto.getRandomValues(new Uint32Array(32));

export const salt = encoder.encode('test.v1');

export const b64 = {
	from: (str) => Uint8Array.from(
		atob(
			str
				.replace(/-/g, '+')
				.replace(/_/g, '/')
		),
		(c) => c.charCodeAt(0),
	),
	to: (buf) => btoa(
		String.fromCharCode(...new Uint8Array(buf))
			.replace(/\+/g,'-')
			.replace(/\//g, '_')
			.replace(/=+$/g, '')
	),
};

export const decrypt = async (key, data, iv) => {
	const decrypted = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		key,
		data,
	);

	let output = decoder.decode(decrypted);
	try { output = JSON.parse(output) } catch {}

	return output;
};

export const encrypt = async (key, data) => {
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const input = encoder.encode(
		typeof data !== 'string'
			? JSON.stringify(data)
			: data
	);
	const encrypted = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		input,
	);

	return {
		encrypted,
		iv,
	};
};

export const identify = (size = 6) => Math.random().toString(16).slice(2, size+2);

export const db = openDB('ClientCrypt', 1, {
	upgrade(db) {
		const store = db.createObjectStore('emails', { autoIncrement: false });

		store
			.createIndex('box', 'box'); // 'draft'|'in'|'out'|'sent'
		store
			.createIndex('date', 'date');
	},
})
