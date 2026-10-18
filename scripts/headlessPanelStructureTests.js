import assert from 'assert/strict'
import test from 'node:test'
import structure from './headlessPanelStructure.js'

test('headless declarations are separate from the menu renderer', () => {
    assert.equal(Object.hasOwn(structure, 'settingsOverride.json'), false)
    assert.equal(Object.hasOwn(structure.panel, 'routes.jsx'), false)
    assert.match(structure.panel['menu.jsx'], /import menu from '\.\.\/menu.jsx'/)
})
