import assert from 'assert/strict'
import fs from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import createSitePartConfiguration from './createSitePartConfiguration.js'

test('runs the composed part initializers once per module load', async t => {
    const root = fs.mkdtempSync(path.join(tmpdir(), 'sitePartConfiguration'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const src = path.join(root, 'src')
    fs.mkdirSync(src)
    const destination = path.join(src, 'sitePartConfiguration.js')
    createSitePartConfiguration(src)
    assert.doesNotMatch(fs.readFileSync(destination, 'utf8'), /import /)
    for (const part of ['sample', 'another']) {
        const directory = path.join(root, 'clientFunctions', part)
        fs.mkdirSync(directory, { recursive: true })
        fs.writeFileSync(path.join(directory, 'siteConfig.js'), `export default () => process.emit('partConfigured', '${part}')\n`)
    }
    const calls = []
    const record = name => calls.push(name)
    process.on('partConfigured', record)
    t.after(() => process.off('partConfigured', record))
    createSitePartConfiguration(src)
    const { default: configureSiteParts } = await import(destination)
    configureSiteParts()
    await import(destination)
    assert.deepEqual(calls, ['another', 'sample'])
})
