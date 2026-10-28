import assert from 'assert/strict'
import test from 'node:test'
import { runOnTerminal } from '../scripts/terminal.js'
test('server command output stays machine readable when captured by publication', () => {
    const script = `clear() { printf 'terminalCleared\\n'; }
node() { printf '22 user example.invalid\\n'; }
ssh() { printf '{"ok":true}\\n'; }
export -f clear node ssh
bash "${import.meta.dirname}/runOnServer" example.invalid 'read configuration'`
    const escaped = script.replaceAll(`'`, `'\\''`)
    const output = runOnTerminal(`bash -c '${escaped}'`, { throwOnError: true })
    assert.deepEqual(JSON.parse(output), { ok: true })
})
