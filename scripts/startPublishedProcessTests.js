import assert from 'assert/strict'
import { registerHooks } from 'module'
import { test } from 'node:test'

const mockUrl = new URL('./testFixtures/mockRunOnServer.js', import.meta.url).href
registerHooks({
    resolve: (specifier, context, nextResolve) => specifier.endsWith('/runOnServer.js')
        ? {
            shortCircuit: true,
            url: mockUrl,
        }
        : nextResolve(specifier, context),
})
const { default: startPublishedProcess } = await import('./startPublishedProcess.js')

for (const kind of ['Api', 'Panel', 'Site']) {
    test(`saves the process list only after a successful published ${kind} start`, async () => {
        const calls = []
        globalThis.mockRunOnServer = async (domain, command) => {
            calls.push(command)
            if (command.startsWith('test -x')) return '/usr/bin/pm2'
            if (command.startsWith('node ')) return calls.some(value => value.startsWith('cd ')) ? '3000' : ''
            if (command.startsWith('sed ')) return '3000'
        }
        try {
            await startPublishedProcess({
                domain: 'example.com',
                instance: { serverDirectory: 'example' },
                params: {
                    [`is${kind}`]: true,
                    process: kind.toLowerCase(),
                },
            })
            const starts = calls.filter(command => command.startsWith('cd '))
            assert.equal(starts.length, 1)
            assert.match(starts[0], /&& .* start .* && \/usr\/bin\/pm2 save$/)
        } finally {
            delete globalThis.mockRunOnServer
        }
    })
}

test('propagates a failed process start without issuing a separate save', async () => {
    const calls = []
    globalThis.mockRunOnServer = async (domain, command) => {
        calls.push(command)
        if (command.startsWith('test -x')) return '/usr/bin/pm2'
        if (command.startsWith('node ')) return ''
        if (command.startsWith('sed ')) return '3000'
        if (command.startsWith('cd ')) throw new Error('start failed')
    }
    try {
        await assert.rejects(startPublishedProcess({
            domain: 'example.com',
            instance: { serverDirectory: 'example' },
            params: {
                isApi: true,
                process: 'api',
            },
        }), /start failed/)
        assert.equal(calls.some(command => command === '/usr/bin/pm2 save'), false)
    } finally {
        delete globalThis.mockRunOnServer
    }
})
