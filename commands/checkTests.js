import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import {
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('check clears by default and preserves output when explicitly requested', t => {
    const command = path.join(import.meta.dirname, 'check')
    const directory = mkdtempSync(path.join(os.tmpdir(), 'checkCommand'))
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const target = path.join(directory, 'example file.js')
    writeFileSync(target, '')
    const script = `clear() { printf 'terminalCleared\\n'; }
node() { printf 'checked:%s\\n' "$2"; }
export -f clear node
bash "$@"`
    for (const flags of [[], ['--noClear']]) {
        const result = spawnSync('bash', [
            '-c',
            script,
            'checkTests',
            command,
            target,
            ...flags,
        ], { encoding: 'utf8' })
        assert.equal(result.status, 0, result.stderr)
        assert.equal(result.stdout.includes('terminalCleared\n'), flags.length === 0)
        assert.ok(result.stdout.includes(`checked:${target}\n`))
    }
})

test('check returns the checker failure status after printing its footer', () => {
    const script = `node() { return 7; }
export -f node
bash "$@"`
    const result = spawnSync('bash', [
        '-c',
        script,
        'checkTests',
        path.join(import.meta.dirname, 'check'),
        import.meta.filename,
        '--noClear',
    ], { encoding: 'utf8' })
    assert.equal(result.status, 7, result.stderr)
})

test('refusing to check the filesystem root returns failure', () => {
    const result = spawnSync('bash', [
        path.join(import.meta.dirname, 'check'),
        '/',
        '--noClear',
    ], { encoding: 'utf8' })
    assert.equal(result.status, 1)
})

test('a missing file prints one concise error and returns failure', t => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'checkMissing'))
    t.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const result = spawnSync('bash', [
        path.join(import.meta.dirname, 'check'),
        path.join(directory, 'missing.js'),
        '--noClear',
    ], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.equal(result.stderr, 'File does not exist\n')
    assert.equal(result.stdout, '')
})
