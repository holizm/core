import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'

test('shared tests command runs without an npm script and preserves failure status', context => {
    const directory = mkdtempSync(path.join(tmpdir(), 'sharedTests'))
    context.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const command = path.join(import.meta.dirname, 'tests')
    const file = path.join(directory, 'sampleTests.js')
    writeFileSync(file, "const test = require('node:test')\ntest('sample', () => {})\n")
    const options = {
        cwd: directory,
        env: {
            ...process.env,
            TERM: 'dumb',
        },
        stdio: 'pipe',
    }
    assert.doesNotThrow(() => execFileSync('bash', [command], options))
    writeFileSync(file, "const test = require('node:test')\ntest('sample', () => { throw new Error('failed') })\n")
    assert.throws(() => execFileSync('bash', [command], options))
})
