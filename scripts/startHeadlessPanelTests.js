import assert from 'assert/strict'
import test from 'node:test'
import { headlessPanelStructure } from './startHeadlessPanel.js'

test('headless panel scaffolding does not create a settings override', () => {
    assert.equal(Object.hasOwn(headlessPanelStructure, 'settingsOverride.json'), false)
})
