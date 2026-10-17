import assert from 'assert/strict'
import { readFileSync } from 'fs'
import test from 'node:test'

test('panel startup does not recreate an optional settings override from a template', () => {
    const source = readFileSync(new URL('./startPanel.js', import.meta.url), 'utf8')
    assert.doesNotMatch(source, /copyFileIfNotExists\([^\n]*settingsOverride/)
})
