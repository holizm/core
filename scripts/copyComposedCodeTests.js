import assert from 'assert/strict'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { registerHooks } from 'module'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import {
    runOnTerminal,
    runOnTerminalAsync,
} from './terminal.js'

const mockUrl = new URL('../testing/scripts/terminalStreamMockProvider.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/terminal.js')
        ? {
            shortCircuit: true,
            url: mockUrl,
        }
        : nextResolve(specifier, context),
})
const { default: copyComposedCode } = await import('./copyComposedCode.js')

test('Composed archives exclude metadata and test data before copying while preserving production code', async t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'composedArchive'))
    t.after(() => {
        delete globalThis.mockRunOnTerminal
        delete globalThis.mockRunOnTerminalAsync
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    })
    const home = path.join(directory, 'home')
    const buildDir = path.join(directory, 'build')
    for (const name of ['core/essentialParts', 'core/run.js', 'core/.git/objects/private', 'core/spl/ast', 'core/testing/record.js', 'sample/userApi/process.js', 'sample/userApi/node_modules/core/run.js', 'sample/userApi/node_modules/core/.git/config', 'sample/userApi/node_modules/core/testing/example.js', 'packages/dependency.js']) {
        const file = path.join(home, name)
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, 'retained')
    }
    const localCommand = command => command.replaceAll('docker exec archiveApi bash', 'bash')
    globalThis.mockRunOnTerminal = (command, options) => runOnTerminal(localCommand(command), options)
    globalThis.mockRunOnTerminalAsync = command => runOnTerminalAsync(localCommand(command))
    await copyComposedCode({
        buildDir,
        containerHome: home,
        containerName: 'archiveApi',
        process: 'userApi',
        processBuildDir: path.join(buildDir, 'sample/userApi'),
        repo: 'sample',
    })
    for (const name of ['core/run.js', 'sample/userApi/process.js', 'sample/userApi/node_modules/core/run.js', 'sample/userApi/node_modules/core/essentialParts']) {
        assert.equal(readFileSync(path.join(buildDir, name), 'utf8'), 'retained')
    }
    for (const name of ['core/.git', 'core/spl', 'core/testing', 'packages', 'sample/userApi/node_modules/core/.git', 'sample/userApi/node_modules/core/testing']) {
        assert.equal(existsSync(path.join(buildDir, name)), false, name)
    }
})
