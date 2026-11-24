import assert from 'assert/strict'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import { pathToFileURL } from 'url'
import {
    deleteFile,
    writeFile,
} from '../../scripts/os.js'
import { runOnTerminalAsync } from '../../scripts/terminal.js'

test('business exports qualify duplicate names and exclude test code', async context => {
    const directory = mkdtempSync(path.join(tmpdir(), 'businessExports'))
    context.after(() => deleteFile(directory))
    const root = path.join(directory, 'sample/siteApi/node_modules/contacts')
    writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }))
    writeFile(path.join(root, 'business/alpha/get.js'), `export default () => 'first'`)
    writeFile(path.join(root, 'business/beta/get.js'), `export default () => 'second'`)
    writeFile(path.join(root, 'business/gamma/lookup.js'), `export const lookup = () => 'public'; export default lookup`)
    writeFile(path.join(root, 'business/delta/select.js'), `export const select = () => 'public'; export default select`)
    writeFile(path.join(root, 'business/epsilon/select.js'), `export default () => 'other'`)
    writeFile(path.join(root, 'business/alpha/getTests.js'), 'export const leakedTest = true')
    for (const scope of ['testing', 'integrationTests']) {
        writeFile(path.join(root, 'business', scope, 'provider.js'), 'export const leakedMock = true')
    }
    const generator = new URL('./generateBusinessExports.js', import.meta.url).pathname
    await runOnTerminalAsync(`'${process.execPath}' '${generator}' contacts`, {
        env: {
            ...process.env,
            containerHome: directory,
            process: 'siteApi',
            repo: 'sample',
        },
        throwOnError: true,
    })
    const output = path.join(root, '../contactsBusiness/exports.js')
    const exports = await import(pathToFileURL(output).href)
    assert.deepEqual(Object.keys(exports).sort(), ['alphaGet', 'betaGet', 'deltaSelect', 'epsilonSelect', 'lookup'])
    assert.equal(exports.alphaGet(), 'first')
    assert.equal(exports.betaGet(), 'second')
    assert.equal(exports.deltaSelect(), 'public')
    assert.equal(exports.epsilonSelect(), 'other')
    assert.equal(exports.lookup(), 'public')
})
