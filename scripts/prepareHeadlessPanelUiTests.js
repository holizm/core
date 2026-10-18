import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import prepareHeadlessPanelUi from './prepareHeadlessPanelUi.js'

test('headless composition supplies its own bootstrap exports and preserves customization', t => {
    const processPath = fs.mkdtempSync(path.join(os.tmpdir(), 'headlessUiContract'))
    t.after(() => fs.rmSync(processPath, { force: true, recursive: true }))
    fs.mkdirSync(path.join(processPath, 'panel'))
    fs.writeFileSync(path.join(processPath, 'panel/error.jsx'), '')
    const volumes = []
    const params = {
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        home: path.resolve(import.meta.dirname, '../..'),
        process: 'userPanel',
        processPath,
        repo: 'phoneAi',
    }
    prepareHeadlessPanelUi(params)
    const entryPath = path.join(processPath, 'panelUi.jsx')
    const entry = fs.readFileSync(entryPath, 'utf8')
    assert.match(entry, /export default \{/)
    for (const component of ['Error', 'ErrorBoundary', 'Loader', 'NoAccess']) {
        assert.match(entry, new RegExp(`    ${component},`))
    }
    assert.match(entry, /Root: Routing/)
    assert.doesNotMatch(entry, /simplePanel|complexPanel/)
    assert.ok(volumes.some(([source, target]) => source === entryPath && target === '/container/phoneAi/userPanel/src/panelUi.jsx'))
    assert.match(fs.readFileSync(path.join(processPath, 'panel/error.jsx'), 'utf8'), /export default/)
    fs.writeFileSync(entryPath, 'export default customUi\n')
    fs.writeFileSync(path.join(processPath, 'panel/error.jsx'), 'export default CustomError\n')
    prepareHeadlessPanelUi(params)
    assert.equal(fs.readFileSync(entryPath, 'utf8'), 'export default customUi\n')
    assert.equal(fs.readFileSync(path.join(processPath, 'panel/error.jsx'), 'utf8'), 'export default CustomError\n')
})
