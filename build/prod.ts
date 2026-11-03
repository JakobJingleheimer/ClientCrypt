import { build } from 'esbuild';

import { config } from './config.ts';

const { errors } = await build({
	...config,
	bundle: true,
	// entryNames: '[dir]/[name]-[hash]',
	entryNames: '[dir]/[name]',
	// assetNames: '[dir]/[name]-[hash]',
	assetNames: '[dir]/[name]',
	minify: true,
	write: true,
});

if (errors.length) throw new AggregateError(errors);
