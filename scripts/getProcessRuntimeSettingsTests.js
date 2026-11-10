import assert from 'assert/strict'
import test from 'node:test'
import getProcessRuntimeSettings from './getProcessRuntimeSettings.js'

test('existing processes keep their default runtime and declared read-only paths are deduplicated', () => {
    const defaults = getProcessRuntimeSettings({
        processPath: '/sample/api',
        readContent: () => '',
    })
    assert.deepEqual(defaults, {
        internal: false,
        readOnlyDirectories: [],
    })
    const runtime = getProcessRuntimeSettings({
        processPath: '/sample/api',
        readContent: () => JSON.stringify({
            runtime: {
                internal: true,
                readOnlyDirectories: ['/logs', '/logs'],
            },
        }),
    })
    assert.equal(runtime.internal, true)
    assert.deepEqual(runtime.readOnlyDirectories, ['/logs'])
})

test('invalid mount declarations fail before container generation', () => {
    for (const directory of ['relative', '/', '/logs\nother', null]) {
        assert.throws(() => getProcessRuntimeSettings({
            processPath: '/sample/api',
            readContent: () => JSON.stringify({ runtime: { readOnlyDirectories: [directory] } }),
        }), TypeError)
    }
})
