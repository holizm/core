import { registerHooks } from 'module'
import { tmpdir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import generateTestDataExports from './generateTestDataExports.js'

const aliases = {
    ...await generateTestDataExports({
        home: fileURLToPath(new URL('../../', import.meta.url)),
        outputDirectory: path.join(tmpdir(), 'testDataExports', String(process.pid)),
    }),
    panelTests: new URL('../../panel/test/exports.js', import.meta.url).href,
    test: 'node:test',
}

registerHooks({
    resolve: (specifier, context, nextResolve) => nextResolve(
        Object.hasOwn(aliases, specifier) ? aliases[specifier] : specifier,
        context,
    ),
})
