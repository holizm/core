import { registerHooks } from 'module'

const aliases = {
    panelTests: new URL('../../panel/test/exports.js', import.meta.url).href,
    test: 'node:test',
}

registerHooks({
    resolve: (specifier, context, nextResolve) => nextResolve(
        Object.hasOwn(aliases, specifier) ? aliases[specifier] : specifier,
        context,
    ),
})
