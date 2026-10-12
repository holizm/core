import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { registerHooks } from 'module'
import { test } from 'node:test'

const serverMockUrl = new URL('./testFixtures/mockRunOnServer.js', import.meta.url).href
const terminalMockUrl = new URL('./testFixtures/mockRunStreaming.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/runOnServer.js')
        ?
        { shortCircuit: true, url: serverMockUrl }
        :
        specifier.endsWith('/terminal.js')
            ?
            { shortCircuit: true, url: terminalMockUrl }
            :
            nextResolve(specifier, context),
})
const { default: initializePublishedSettingsOverride } = await import('./initializePublishedSettingsOverride.js')

test('initializePublishedSettingsOverride skips absent settings', async () => {
    const calls = []
    globalThis.mockRunOnServer = (...rest) => calls.push(rest)
    globalThis.mockRunStreaming = (...rest) => calls.push(rest)
    try {
        await initializePublishedSettingsOverride({
            settingsOverridePath: '/tmp/absentSettingsOverrideForTest.json',
        })
        assert.deepEqual(calls, [])
    }
    finally {
        delete globalThis.mockRunOnServer
        delete globalThis.mockRunStreaming
    }
})

test('initializePublishedSettingsOverride copies the local file before server setup', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'settingsOverride'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const settingsOverridePath = path.join(directory, 'settingsOverride.json')
    fs.writeFileSync(settingsOverridePath, '{}')
    const calls = []
    globalThis.mockRunOnServer = (...rest) => calls.push(['server', ...rest])
    globalThis.mockRunStreaming = (...rest) => calls.push(['stream', ...rest])
    try {
        await initializePublishedSettingsOverride({
            domain: 'example.com',
            remoteBuildDir: '/tmp/build',
            remoteProcessPath: '/srv/api',
            settingsOverridePath,
        })
        assert.equal(calls[0][0], 'stream')
        assert.match(calls[0][1], /serverCopy/)
        assert.equal(calls[1][0], 'server')
        assert.equal(calls[1][1], 'example.com')
        assert.match(calls[1][2], /\[ -f \/srv\/api\/settingsOverride\.json \]/)
    }
    finally {
        delete globalThis.mockRunOnServer
        delete globalThis.mockRunStreaming
    }
})
