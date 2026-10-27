// Usa TypeScript ya instalado. Solo se carga mediante el comando de pruebas.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    if (!/\.[a-z]+$/i.test(url.pathname)) {
      for (const extension of ['.ts', '.tsx']) {
        const candidate = new URL(url.href);
        candidate.pathname += extension;
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  const parsed = new URL(url);
  if (/\.(css|svg|png|webp)$/.test(parsed.pathname)) {
    return { format: 'module', shortCircuit: true,
      source: parsed.pathname.endsWith('.css')
        ? 'export default new Proxy({}, { get: (_, key) => key });'
        : `export default ${JSON.stringify(url)};` };
  }
  if (/\.tsx?$/.test(parsed.pathname)) {
    const source = (await readFile(fileURLToPath(parsed), 'utf8'))
      .replaceAll('import.meta.env.DEV', parsed.searchParams.has('production') ? 'false' : 'true');
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      fileName: fileURLToPath(parsed),
    }).outputText };
  }
  return nextLoad(url, context);
}
