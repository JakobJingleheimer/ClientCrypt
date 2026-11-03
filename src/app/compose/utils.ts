import type { GenericEventHandler, SubmitEventHandler } from 'preact';

import {
	b64,
	challenge,
	db,
	decrypt,
	encoder,
	encrypt,
	identify,
	salt,
} from '../common.ts';


export async function loadEmail(id: string, key: CryptoKey) {
	const record = await (await db).get('emails', id);

	if (record) return decrypt<Record<string, string | number>>(key, record.contents, record.iv);
}

export const handleReset: GenericEventHandler<HTMLFormElement> = async (event) => {
	const id = (new URLSearchParams(location.search)).get('id');

	if (!id) return;

	(await db).delete('emails', id);

	const url = new URL(location.href);
	url.searchParams.delete('id');
	history.pushState(undefined, '', url);
}

type ComposeEmailFormFields = {
	to: HTMLInputElement & { name: 'to' },
	cc: HTMLInputElement & { name: 'cc' },
	bcc: HTMLInputElement & { name: 'bcc' },
	subject: HTMLInputElement & { name: 'subject' },
	body: HTMLTextAreaElement & { name: 'body' },
};
type ComposeEmailFieldNames = keyof ComposeEmailFormFields;
type ComposeEmailFormElements = ComposeEmailFormFields & Iterable<ComposeEmailFormFields[ComposeEmailFieldNames]>;

export const handleSubmit: SubmitEventHandler<
	& HTMLFormElement
	& { elements: ComposeEmailFormElements }
> = async (event) => {
	event.preventDefault();

	const data = {} as Record<ComposeEmailFieldNames, unknown>;
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
	history.pushState(undefined, '', url);
}
