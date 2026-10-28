import assert from 'assert/strict'
import { registerHooks } from 'module'
import test from 'node:test'
const mockUrl = new URL('./testFixtures/mockRunOnServer.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => {
        if (!specifier.endsWith('/runOnServer.js')) return nextResolve(specifier, context)
        const result = {
            shortCircuit: true,
            url: mockUrl,
        }
        return result
    },
})
const { default: getPublishedProcessPort } = await import('./getPublishedProcessPort.js')
const params = {
    domain: 'example.com',
    fullProcessName: 'exampleAdminApi',
    pm2: '/usr/bin/pm2',
    processPath: '$HOME/example/adminApi',
}
test('publication preserves the serving process port instead of an obsolete compose port', async () => {
    const calls = []
    globalThis.mockRunOnServer = async (domain, command) => {
        calls.push(command)
        return command.startsWith('node ') ? '52928' : '54094'
    }
    try {
        assert.equal(await getPublishedProcessPort(params), '52928')
        assert.equal(calls.length, 1)
    } finally {
        delete globalThis.mockRunOnServer
    }
})
test('a first publication falls back to the configured compose port', async () => {
    globalThis.mockRunOnServer = async (domain, command) => command.startsWith('node ') ? '' : '54094'
    try {
        assert.equal(await getPublishedProcessPort(params), '54094')
    } finally {
        delete globalThis.mockRunOnServer
    }
})
test('a stopped process retains its existing process-manager port before considering compose', async () => {
    let calls = 0
    globalThis.mockRunOnServer = async () => ++calls === 1 ? '' : '52928'
    try {
        assert.equal(await getPublishedProcessPort(params), '52928')
        assert.equal(calls, 2)
    } finally {
        delete globalThis.mockRunOnServer
    }
})
test('publication readiness never succeeds merely because a configured port exists', async () => {
    let calls = 0
    globalThis.mockRunOnServer = async () => {
        calls++
        return ''
    }
    try {
        await assert.rejects(getPublishedProcessPort({
            ...params,
            requireListening: true,
        }), /did not start listening/)
        assert.equal(calls, 1)
    } finally {
        delete globalThis.mockRunOnServer
    }
})
