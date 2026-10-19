import assert from 'assert/strict'
import {
    spawn,
    spawnSync,
} from 'child_process'
import test from 'node:test'
import { fileURLToPath } from 'url'

test('up identifies its process scan and preserves complete command arguments', () => {
    const marker = `upArgument${'x'.repeat(600)}`
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)', marker])
    try {
        const result = spawnSync('bash', [
            fileURLToPath(new URL('./up', import.meta.url)),
            '--once',
        ], { encoding: 'utf8' })
        assert.equal(result.status, 0, result.stderr)
        assert.match(result.stdout, /up \(process monitor\) -ww -eo/)
        assert.ok(result.stdout.includes(marker))
        assert.match(result.stdout, /NAME\s+PID\s+CPU%\s+MEM%\s+COMMAND/)
    }
    finally {
        child.kill()
    }
})
