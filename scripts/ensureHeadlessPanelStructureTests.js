import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import ensureHeadlessPanelStructure from './ensureHeadlessPanelStructure.js'

test('scaffolding creates nested files and preserves existing implementations', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'headlessScaffold'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const structure = { panel: { 'menu.jsx': 'export default Menu\n' } }
    ensureHeadlessPanelStructure(directory, structure)
    const file = path.join(directory, 'panel/menu.jsx')
    assert.equal(fs.readFileSync(file, 'utf8'), 'export default Menu\n')
    fs.writeFileSync(file, 'export default CustomMenu\n')
    ensureHeadlessPanelStructure(directory, structure)
    assert.equal(fs.readFileSync(file, 'utf8'), 'export default CustomMenu\n')
})
