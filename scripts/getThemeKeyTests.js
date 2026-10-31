import assert from 'assert/strict'
import test from 'node:test'
import getThemeKey from './getThemeKey.js'

test('core and runnable themes retain distinct keys for the same number', () => {
    assert.equal(getThemeKey('theme001'), '001')
    assert.equal(getThemeKey('coreTheme001'), 'core001')
    assert.equal(getThemeKey('theme01'), '01')
    assert.equal(getThemeKey('../siteThemes/theme001'), 'core001')
    assert.equal(getThemeKey('../siteThemes/theme032'), 'core032')
    assert.equal(getThemeKey('theme32'), '32')
})
