import assert from 'assert/strict'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockReloadWebServer.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => [
        '/terminal.js',
        '/pruneInactiveWebServerConfigs.js',
    ].some(suffix => specifier.endsWith(suffix))
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: reloadWebServer } = await import('./reloadWebServer.js')

test('reloadWebServer prunes inactive configurations before a validated reload', () => {
    const calls = []
    globalThis.mockWebServerCalls = calls
    try {
        const result = reloadWebServer({
            containerName: 'shopApi',
            home: '/home/dev',
        })
        assert.equal(result, 'reloaded')
        assert.equal(calls[0][0], 'terminal')
        assert.deepEqual(calls[1][1], {
            activeContainers: ['shopApi', 'shopPanel'],
            home: '/home/dev',
            keepContainerName: 'shopApi',
            root: '/tmp',
        })
        assert.equal(calls[2][0], 'terminal')
        assert.match(calls[2][1], /nginx -t/)
    }
    finally {
        delete globalThis.mockWebServerCalls
    }
})
