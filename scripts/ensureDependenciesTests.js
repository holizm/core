import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import ensureDependencies from './ensureDependencies.js'

test('ensureDependencies creates a default only when no declaration exists', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dependencies'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    const dependenciesPath = path.join(root, 'dependencies')
    ensureDependencies({ dependenciesPath })
    assert.equal(fs.readFileSync(dependenciesPath, 'utf8'), 'blog\n')
    fs.writeFileSync(dependenciesPath, 'orders\n')
    ensureDependencies({ dependenciesPath })
    assert.equal(fs.readFileSync(dependenciesPath, 'utf8'), 'orders\n')
})
