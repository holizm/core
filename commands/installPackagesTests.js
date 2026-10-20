import assert from 'assert/strict'
import { spawn } from 'child_process'
import { once } from 'events'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'

test('concurrent package commands wait their turn and forward requested packages', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'installPackages'))
    t.after(() => rmSync(directory, { force: true, recursive: true }))
    const bin = join(directory, 'bin')
    const calls = join(directory, 'calls')
    mkdirSync(bin)
    writeFileSync(join(bin, 'npm'), `#!/bin/sh
printf 'begin %s\\n' "$*" >> "$calls"
sleep 0.1
printf 'end\\n' >> "$calls"
`, { mode: 0o755 })
    const options = {
        cwd: directory,
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, calls },
        stdio: 'ignore',
    }
    const command = new URL('./installPackages', import.meta.url).pathname
    const first = spawn('bash', [command, 'examplePackage'], options)
    const second = spawn('bash', [command, 'examplePackage'], options)
    const results = await Promise.all([once(first, 'exit'), once(second, 'exit')])
    assert.deepEqual(results.map(result => result[0]), [0, 0])
    const lines = readFileSync(calls, 'utf8').trim().split('\n')
    assert.match(lines[0], /^begin install .*examplePackage$/)
    assert.equal(lines[1], 'end')
    assert.match(lines[2], /^begin install .*examplePackage$/)
    assert.equal(lines[3], 'end')
})
