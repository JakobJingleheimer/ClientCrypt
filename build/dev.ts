import { readFileSync, watch } from 'node:fs';
import http2, { type Http2SecureServer, type ServerHttp2Stream } from 'node:http2';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { context } from 'esbuild';
import mime from 'mime-types';

import { config, outdir } from './config.ts';
import { styleText } from 'node:util';


const ctx = await context({
	...config,
	entryNames: '[dir]/[name]',
	assetNames: '[dir]/[name]',
	logLevel: 'info',
	sourcemap: 'inline',
	write: false,
});

await ctx.watch();

const server = http2.createSecureServer({
	cert: readFileSync(fileURLToPath(import.meta.resolve('../cert.pem'))),
  key: readFileSync(fileURLToPath(import.meta.resolve('../key.pem'))),
});

const files = new Map();

await rebuild();

server.on('stream', async (stream: ServerHttp2Stream, headers) => {
  if (headers[':method'] !== 'GET') {
		console.error(styleText(['red'], `[Dev Server]: Unsupported method ${headers[':method']}`));
    stream.respond({ ':status': 405 });
    return stream.end();
  }

  let pathname;

  try {
    pathname = decodeURIComponent(new URL(headers[':path']!, 'https://localhost').pathname);
  } catch {
		console.error(styleText(['red'], '[Dev Server]: Could not determine pathname'), headers);
    stream.respond({ ':status': 400 });
    return stream.end();
  }

  if (
		headers['sec-fetch-dest'] === 'document'
		|| headers['accept']?.startsWith('text/html')
	) pathname = '/index.html';
	console.log('[Dev Server]: GET', pathname);

  const filePath = path.resolve(outdir, `.${pathname}`);

  const contents = files.get(filePath);

  if (!contents) {
		console.error(styleText(['red'], `[Dev Server]: No contents for ${pathname}`));
    stream.respond({
      ':status': 404,
      'content-type': 'text/plain',
    });
    return stream.end('Not found');
  }

	console.log('[Dev Server]: Successfully handled', pathname);
  stream.respond({
    ':status': 200,
    'content-type': mime.lookup(filePath) || 'text/plain',
    'content-length': contents.byteLength,
  });
  return stream.end(contents);
});

server.listen({
	host: '0.0.0.0',
	port: 8443,
}, () => {
	const { lan, local, port } = getAddressInfo(server);

	console.log(`> Local:\thttps://${local}:${port}/`);
	console.log(lan ? `> Network:\thttps://${lan}:${port}/` : '> Network:\tUnavailable');
});

watch('src', { recursive: true }, async () => {
  try { await rebuild() }
	// @ts-expect-error
	catch (err) { console.error(styleText(['red'], err.message), err.stack) }
});

function getAddressInfo(server: Http2SecureServer) {
	const lan = getLANAddress();
	const addr = server.address();
	let local: string;
	let port: number;

	if (addr == null) throw new Error('Server failed to bind');

	if (typeof addr === 'string') {
		([local, port] = addr.split(':') as [string, number]);
	} else {
		local = addr.address;
		port = addr.port;
	}

	return {
		local,
		lan,
		port,
	};
}

function getLANAddress() {
	for (const addresses of Object.values(os.networkInterfaces())) for (const addr of addresses ?? []) {
		if (
			addr.family === 'IPv4'
			&& !addr.internal
			&& (
				addr.address.startsWith('192.168')
				|| addr.address.startsWith('10.')
			)
		) return addr.address;
	}
}

async function rebuild() {
  const result = await ctx.rebuild();

	files.clear();

	for (const file of result.outputFiles) files.set(path.resolve(file.path), file.contents);
}
