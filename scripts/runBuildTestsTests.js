import assert from 'assert/strict'
import { registerHooks } from 'module'
import test from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunStreaming.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/terminal.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: runBuildTests } = await import('./runBuildTests.js')

test('build tests run before compilation and preserve failures', async () => {
    const calls = []
    globalThis.mockRunStreaming = command => {
        calls.push(command)
        if (command.includes('npm test')) throw new Error('failed')
    }
    try {
        await assert.rejects(runBuildTests({ containerName: 'shopPanel', isPanel: true }), /failed/)
        assert.match(calls[0], /panelReady/)
        assert.match(calls[1], /npm test/)
        calls.length = 0
        await runBuildTests({ containerName: 'shopApi', isApi: true })
        assert.match(calls[0], /apiReady/)
        assert.match(calls[1], /npm run tests/)
    }
    finally {
        delete globalThis.mockRunStreaming
    }
})
