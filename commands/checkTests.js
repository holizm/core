import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import path from 'path'
import test from 'node:test'

test('check clears by default and preserves output when explicitly requested', () => {
    const command = path.join(import.meta.dirname, 'check')
    const target = '/tmp/example file.js'
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
        '/tmp/example.js',
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
