// Loader di test: "@opencode/plugin" non e' installato in questo repo,
// ma src/index.ts lo importa (statico, come in produzione sotto l'host).
// Lo stub riproduce l'unica API usata: Plugin.define e' l'identita'
// (verificato su @opencode/plugin 2.4.1: `export function define(p){return p}`).
export async function resolve(specifier, context, next) {
  if (specifier === '@opencode/plugin') {
    const stub = 'export const Plugin = { define: (p) => p };';
    return { url: 'data:text/javascript,' + encodeURIComponent(stub), shortCircuit: true };
  }
  return next(specifier, context);
}
