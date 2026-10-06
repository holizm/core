import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

const events = []
let failCopy = false
const params = {
    buildDir: '/var/tmp/buildTest',
    containerName: 'buildTest',
    isApi: true,
    localBuild: true,
    processBuildDir: '/var/tmp/buildTest/api',
}
mock.module('./start.js', { defaultExport: async () => params })
mock.module('./stop.js', { defaultExport: async value => {
    assert.equal(value.containerName, params.containerName)
    events.push('stop')
} })
mock.module('./copyComposedCode.js', { defaultExport: async () => {
    events.push('copy')
    if (failCopy) throw new Error('copyFailed')
} })
mock.module('./copySiteContent.js', { defaultExport: () => {} })
mock.module('./buildImage.js', { defaultExport: async () => {} })
mock.module('./logger.js', { exports: {
    divide: () => {},
    info: () => {},
} })
mock.module('./os.js', { exports: {
    deleteByPatterns: async () => {},
    removeAndRecreateDir: () => {},
} })
mock.module('./terminal.js', { exports: {
    runOnTerminal: () => events.push('compress'),
    runOnTerminalAsync: async () => {},
    runStreaming: async () => {},
} })
const { default: build } = await import('./build.js')

test('Completed build copies and compresses before stopping its exact source container', async () => {
    const result = await build({})
    assert.equal(result, params)
    assert.deepEqual(events, ['copy', 'compress', 'stop'])
})

test('Failed builds still stop their source container', async () => {
    events.length = 0
    failCopy = true
    await assert.rejects(build({}), /copyFailed/)
    assert.deepEqual(events, ['copy', 'stop'])
})
