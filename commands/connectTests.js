import assert from 'assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from '../scripts/terminal.js'
import createFixture from '../testing/commands/serverConnectionEnvironmentProvider.js'

test('machine-readable connection output excludes terminal clearing', async context => {
    const fixture = createFixture(context)
    fixture.writeTool('clear', `#!/usr/bin/env bash
printf 'terminalCleared\n'
`)
    fixture.writeTool('ssh', `#!/usr/bin/env bash
printf '{"ok":true}\n'
`)
    const command = fileURLToPath(new URL('./connect', import.meta.url))
    const output = await runOnTerminalAsync(`bash '${command}' fixture 'read configuration'`, {
        env: fixture.env,
        throwOnError: true,
    })
    assert.deepEqual(JSON.parse(output), { ok: true })
})

test('command and transfer connections share configured keep-alive settings', async context => {
    const fixture = createFixture(context)
    fixture.writeTool('ssh', '#!/usr/bin/env bash\nprintf "%s\\n" "$@"\n')
    const command = fileURLToPath(new URL('./connect', import.meta.url))
    const invoke = args => runOnTerminalAsync(`bash '${command}' fixture ${args}`, {
        env: fixture.env,
        throwOnError: true,
    })
    const connection = ['-A', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=12', '-p', '22', 'dev@localhost']
    assert.deepEqual((await invoke("'printf value'")).split('\n'), [...connection, 'printf value'])
    assert.deepEqual((await invoke('--transport fixture rsync --server')).split('\n'), [...connection, 'rsync', '--server'])
    fixture.env.serverAliveCountMax = '20'
    assert.ok((await invoke("'printf value'")).split('\n').includes('ServerAliveCountMax=20'))
    assert.ok((await invoke('--transport fixture rsync --server')).split('\n').includes('ServerAliveCountMax=20'))
    await assert.rejects(() => invoke('--transport'))
})
