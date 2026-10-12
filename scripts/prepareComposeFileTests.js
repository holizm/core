import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import prepareComposeFile from './prepareComposeFile.js'

test('prepareComposeFile converts file binds and prepares nested targets', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'prepareComposeFile'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const parent = path.join(directory, 'parent')
    const source = path.join(directory, 'source.txt')
    const compose = path.join(directory, 'compose.yaml')
    fs.mkdirSync(parent)
    fs.writeFileSync(source, 'source')
    fs.writeFileSync(compose, `    - ${parent}:/app\n    - ${source}:/app/nested/source.txt:ro\n`)
    assert.equal(prepareComposeFile(compose), compose)
    const content = fs.readFileSync(compose, 'utf8')
    assert.match(content, /read_only: true/)
    assert.match(content, /create_host_path: false/)
    assert.equal(fs.statSync(path.join(parent, 'nested', 'source.txt')).isFile(), true)
    prepareComposeFile(compose)
    assert.equal(fs.readFileSync(compose, 'utf8'), content)
})

test('prepareComposeFile rejects missing bind sources', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'prepareComposeFile'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const compose = path.join(directory, 'compose.yaml')
    fs.writeFileSync(compose, `    - ${path.join(directory, 'absent')}:/app\n`)
    assert.throws(() => prepareComposeFile(compose), /Missing bind mount sources/)
})
