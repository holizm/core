import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import {
    ensureHeadlessPanelStructure,
    headlessPanelDeclarations,
    headlessPanelStructure,
} from './startHeadlessPanel.js'

test('headless panel scaffolding does not create a settings override', () => {
    assert.equal(Object.hasOwn(headlessPanelStructure, 'settingsOverride.json'), false)
})

test('headless scaffolding separates root data from the panel menu renderer', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'headlessDeclarations'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    ensureHeadlessPanelStructure(directory, headlessPanelStructure)
    ensureHeadlessPanelStructure(directory, headlessPanelDeclarations)
    for (const name of ['menu.jsx', 'routes.jsx']) {
        assert.equal(fs.readFileSync(path.join(directory, name), 'utf8'), 'export default []\n')
        fs.writeFileSync(path.join(directory, name), 'export default customDeclarations\n')
    }
    const menuPath = path.join(directory, 'panel/menu.jsx')
    const renderer = fs.readFileSync(menuPath, 'utf8')
    assert.match(renderer, /import menu from '\.\.\/menu.jsx'/)
    assert.match(renderer, /<NavLink/)
    assert.equal(fs.existsSync(path.join(directory, 'panel/routes.jsx')), false)
    fs.writeFileSync(menuPath, 'export default CustomMenu\n')
    ensureHeadlessPanelStructure(directory, headlessPanelStructure)
    ensureHeadlessPanelStructure(directory, headlessPanelDeclarations)
    for (const name of ['menu.jsx', 'routes.jsx']) {
        assert.equal(fs.readFileSync(path.join(directory, name), 'utf8'), 'export default customDeclarations\n')
    }
    assert.equal(fs.readFileSync(menuPath, 'utf8'), 'export default CustomMenu\n')
})
