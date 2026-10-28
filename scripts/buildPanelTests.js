import assert from 'assert/strict'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunStreaming.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/terminal.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { buildPanel } = await import('./buildPanel.js')

test('buildPanel waits for readiness, validates UI, and copies the build', async () => {
    const calls = []
    globalThis.mockRunStreaming = command => calls.push(['stream', command])
    globalThis.mockRunOnTerminalAsync = command => calls.push(['copy', command])
    try {
        await buildPanel({
            containerName: 'shopPanel',
            processBuildDir: '/tmp/publishedPanel',
            processPath: '/app/shop/adminPanel',
        })
        assert.equal(calls.length, 3)
        assert.match(calls[0][1], /panelReady/)
        assert.match(calls[1][1], /generateExports\.js && node \.\/validatePanelUi\.js && npm run build/)
        assert.match(calls[2][1], /\/app\/shop\/adminPanel\/dist/)
        assert.match(calls[2][1], /\/tmp\/publishedPanel/)
    }
    finally {
        delete globalThis.mockRunStreaming
        delete globalThis.mockRunOnTerminalAsync
    }
})
