import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findDifferentParts from './findDifferentParts.js'

test('findDifferentParts finds changed and missing part files', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'findDifferentParts'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const development = path.join(directory, 'development')
    const production = path.join(directory, 'production')
    fs.mkdirSync(development)
    fs.mkdirSync(production)
    fs.writeFileSync(path.join(development, 'blog.js'), 'same')
    fs.writeFileSync(path.join(production, 'blog.js'), 'same')
    fs.writeFileSync(path.join(development, 'orders.js'), 'new')
    fs.writeFileSync(path.join(production, 'orders.js'), 'old')
    fs.writeFileSync(path.join(development, 'media.js'), 'only here')
    fs.writeFileSync(path.join(production, 'taxonomy.js'), 'only there')
    assert.deepEqual(findDifferentParts(development, production), ['media', 'orders', 'taxonomy'])
    assert.deepEqual(findDifferentParts(development, production, 'orders,taxonomy'), ['orders', 'taxonomy'])
})
