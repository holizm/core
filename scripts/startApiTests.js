import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import isFile from './isFile.js'

test('runnable dependency mapping requires a part marker rather than a colliding note file', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'apiDependencyMapping'))
    t.after(() => fs.rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const note = path.join(directory, 'tasks')
    const part = path.join(directory, 'rooms')
    fs.writeFileSync(note, 'Hotel planning notes')
    fs.mkdirSync(part)
    fs.writeFileSync(path.join(part, 'part'), 'room\n')
    assert.equal(isFile(path.join(note, 'part')), false)
    assert.equal(isFile(path.join(part, 'part')), true)
    const source = fs.readFileSync(new URL('./startApi.js', import.meta.url), 'utf8')
    assert.ok(source.includes('isFile(`${home}/${repo}/${dependency}/part`)'))
    assert.ok(!source.includes('fs.existsSync(`${home}/${repo}/${dependency}`)'))
})
