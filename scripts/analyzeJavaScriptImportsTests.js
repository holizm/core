import assert from 'assert/strict'
import test from 'node:test'
import analyzeJavaScriptImports from './analyzeJavaScriptImports.js'

test('analyzeJavaScriptImports finds static imports in source order', () => {
    const source = [
        "import React from 'react'",
        "import './styles.css'",
        "const lazy = import('./optional.js')",
        "export { value } from './values.js'",
    ].join('\n')
    assert.deepEqual(analyzeJavaScriptImports(source), ['react', './styles.css'])
})

test('analyzeJavaScriptImports handles JSX, types, and invalid input', () => {
    assert.deepEqual(analyzeJavaScriptImports("import type { Item } from './item.js'\nconst view = <Item />"), ['./item.js'])
    assert.deepEqual(analyzeJavaScriptImports('import {'), [])
})
