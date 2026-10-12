import assert from 'assert/strict'
import { registerHooks } from 'module'
import test from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunOnServer.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/runOnServer.js')
        ?
        { shortCircuit: true, url: mockUrl }
        :
        nextResolve(specifier, context),
})
const { default: getRemoteExecutable } = await import('./getRemoteExecutable.js')

test('getRemoteExecutable checks candidates in order and returns the first executable', async () => {
    const calls = []
    globalThis.mockRunOnServer = async (domain, command, quiet) => {
        calls.push({ domain, command, quiet })
        return command.includes('/usr/local/bin/tool')
            ?
            ' /usr/local/bin/tool '
            :
            ''
    }
    try {
        assert.equal(await getRemoteExecutable('example.com', 'tool', [
            '/usr/bin/tool',
            '/usr/local/bin/tool',
            '/opt/bin/tool',
        ]), '/usr/local/bin/tool')
        assert.equal(calls.length, 2)
        assert.equal(calls[0].domain, 'example.com')
        assert.equal(calls[0].quiet, true)
        assert.match(calls[0].command, /test -x '\/usr\/bin\/tool'/)
    }
    finally {
        delete globalThis.mockRunOnServer
    }
})
