import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import path from 'path'
import test from 'node:test'

test('machine-readable connection output excludes terminal clearing', () => {
    const script = `clear() { printf 'terminalCleared\\n'; }
node() { printf '22 user example.invalid\\n'; }
ssh() { printf '{"ok":true}\\n'; }
export -f clear node ssh
bash "$1" example.invalid 'read configuration'`
    const result = spawnSync('bash', [
        '-c',
        script,
        'connectTests',
        path.join(import.meta.dirname, 'connect'),
    ], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout), { ok: true })
})
