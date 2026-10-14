import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'

test('process tests discover nested siblings and fail on a failed test', t => {
    const directory = mkdtempSync(path.join(tmpdir(), 'processTests'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const nested = path.join(directory, 'src', 'components')
    mkdirSync(nested, { recursive: true })
    const file = path.join(nested, 'rowTests.js')
    writeFileSync(file, "const test = require('node:test')\ntest('row', () => {})\n")
    const command = path.join(import.meta.dirname, 'runProcessTests.js')
    assert.doesNotThrow(() => execFileSync(process.execPath, [command], { cwd: directory }))
    writeFileSync(file, "const test = require('node:test')\ntest('row', () => { throw new Error('failed') })\n")
    assert.throws(() => execFileSync(process.execPath, [command], {
        cwd: directory,
        stdio: 'pipe',
    }))
})
