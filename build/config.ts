import { fileURLToPath } from 'node:url';

import { type BuildOptions } from 'esbuild';


export const outdir = fileURLToPath(import.meta.resolve('../dist'));

export const config = {
	bundle: true,
	entryPoints: [
		// fileURLToPath(import.meta.resolve('../src/sw/main.ts')),
		// fileURLToPath(import.meta.resolve('../src/sw/register.ts')),
		fileURLToPath(import.meta.resolve('../src/app/main.tsx')),
		fileURLToPath(import.meta.resolve('../src/app/index.html')),
	],
	format: 'esm',
	loader: {
		'.html': 'copy',
	},
	jsx: 'automatic',
	jsxImportSource: 'preact',
	outdir,
	outbase: 'src/app',
	splitting: false, // https://github.com/evanw/esbuild/issues/4321
} as const satisfies BuildOptions;
