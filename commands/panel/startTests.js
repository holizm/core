import assert from 'assert/strict'
import { spawn } from 'child_process'
import { once } from 'events'
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'
import { setTimeout } from 'timers/promises'

test('panel start waits for initialization before validating or launching the app', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'panelStart'))
    const bin = join(directory, 'bin')
    const ready = join(directory, 'ready')
    const waiting = join(directory, 'waiting')
    const calls = join(directory, 'calls')
    mkdirSync(bin)
    mkdirSync(join(directory, 'example/adminPanel'), { recursive: true })
    mkdirSync(join(directory, 'core/commands/panel'), { recursive: true })
    writeFileSync(join(directory, 'core/commands/panel/watch'), '#!/bin/sh\nexit 0\n', { mode: 0o755 })
    writeFileSync(join(bin, 'bash'), `#!/bin/sh
printf '%s' "$*" > "$waiting"
while [ ! -f "$ready" ]; do sleep 0.01; done
`, { mode: 0o755 })
    for (const name of ['node', 'npm']) {
        writeFileSync(join(bin, name), `#!/bin/sh\nprintf '%s\\n' '${name}' >> "$calls"\n`, { mode: 0o755 })
    }
    const child = spawn(process.execPath, [new URL('./start', import.meta.url).pathname], {
        env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            calls,
            home: directory,
            process: 'adminPanel',
            ready,
            repo: 'example',
            waiting,
        },
        stdio: 'ignore',
    })
    const finished = once(child, 'exit')
    t.after(() => {
        child.kill()
        rmSync(directory, { force: true, recursive: true })
    })
    const deadline = Date.now() + 5000
    while (!existsSync(waiting) && Date.now() < deadline) await setTimeout(10)
    assert.equal(existsSync(waiting), true)
    assert.match(readFileSync(waiting, 'utf8'), /panelReady/)
    assert.equal(existsSync(calls), false)
    writeFileSync(ready, '')
    assert.equal((await finished)[0], 0)
    while ((!existsSync(calls) || !readFileSync(calls, 'utf8').includes('npm')) && Date.now() < deadline) await setTimeout(10)
    assert.equal(readFileSync(calls, 'utf8'), 'node\nnpm\n')
})
