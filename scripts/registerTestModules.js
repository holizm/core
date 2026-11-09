import { registerHooks } from 'module'
import { tmpdir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import generateTestingExports from './generateTestingExports.js'

const aliases = {
    ...await generateTestingExports({
        home: fileURLToPath(new URL('../../', import.meta.url)),
        outputDirectory: path.join(tmpdir(), 'testingExports', String(process.pid)),
    }),
    panelTests: new URL('../../panel/testing/exports.js', import.meta.url).href,
    test: 'node:test',
}

registerHooks({
    resolve: (specifier, context, nextResolve) => nextResolve(
        Object.hasOwn(aliases, specifier) ? aliases[specifier] : specifier,
        context,
    ),
})
