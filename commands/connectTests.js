import assert from 'assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'url'
import { runOnTerminalAsync } from '../scripts/terminal.js'
import createFixture from './serverConnectionFixtureTests.js'

test('command and transfer connections share configured keep-alive settings', async context => {
    const fixture = createFixture(context)
    fixture.writeTool('ssh', '#!/usr/bin/env bash\nprintf "%s\\n" "$@"\n')
    const command = fileURLToPath(new URL('./connect', import.meta.url))
    const invoke = args => runOnTerminalAsync(`bash '${command}' fixture ${args}`, {
        env: fixture.env,
        throwOnError: true,
    })
    const connection = ['-A', '-o', 'ServerAliveInterval=15', '-p', '22', 'dev@localhost']
    assert.deepEqual((await invoke("'printf value'")).split('\n'), [...connection, 'printf value'])
    assert.deepEqual((await invoke('--transport fixture rsync --server')).split('\n'), [...connection, 'rsync', '--server'])
    await assert.rejects(() => invoke('--transport'))
})
