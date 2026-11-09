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
    assert.deepEqual(Object.keys(exports).sort(), ['alphaGet', 'betaGet'])
    assert.equal(exports.alphaGet(), 'first')
    assert.equal(exports.betaGet(), 'second')
})
