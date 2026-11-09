import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import writeSiteComponentBarrel from './writeSiteComponentBarrel.js'

test('generated file wrappers preserve default and named module exports', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'siteBarrel'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const barrelFile = path.join(root, 'generated', 'item.js')
    const sourceFile = path.join(root, 'source', 'item.js')
    writeSiteComponentBarrel({
        barrelFile,
        hasDefault: true,
        sourceFile,
    })
    const source = fs.readFileSync(barrelFile, 'utf8')
    assert.equal(source, `export { default } from '../source/item.js'\nexport * from '../source/item.js'\n`)
    writeSiteComponentBarrel({
        barrelFile,
        hasDefault: false,
        sourceFile,
    })
    assert.equal(fs.readFileSync(barrelFile, 'utf8'), `export * from '../source/item.js'\n`)
})

test('unchanged wrappers retain their timestamp so unrelated themes are not invalidated', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stableSiteBarrel'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const barrelFile = path.join(root, 'generated', 'item.js')
    const sourceFile = path.join(root, 'source', 'item.js')
    const options = {
        barrelFile,
        hasDefault: true,
        sourceFile,
    }
    writeSiteComponentBarrel(options)
    fs.utimesSync(barrelFile, 1, 1)
    writeSiteComponentBarrel(options)
    assert.equal(fs.statSync(barrelFile).mtimeMs, 1000)
    writeSiteComponentBarrel({
        ...options,
        hasDefault: false,
    })
    assert.notEqual(fs.statSync(barrelFile).mtimeMs, 1000)
    assert.equal(fs.readFileSync(barrelFile, 'utf8'), `export * from '../source/item.js'\n`)
})
