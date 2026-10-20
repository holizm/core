import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import { test } from 'node:test'

test('setup suppresses successful command noise and reports failures without stopping later steps', () => {
    const script = new URL('./installer.sh', import.meta.url).pathname
    const output = execFileSync('bash', ['-c', `
        source "$1"
        runSetupStep working bash -c 'echo noisy'
        runSetupStep broken bash -c 'echo diagnostic; exit 7'
        runSetupStep later true
        printf 'failures=%s\\n' "$setupFailures"
    `, 'bash', script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    assert.match(output, /working ✔/)
    assert.doesNotMatch(output, /noisy/)
    assert.match(output, /later ✔/)
    assert.match(output, /failures=1/)
})
