import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

const calls = []
mock.module('./loadProcessRuntimeSettings.js', {
    defaultExport: () => {
        const runtime = {
            internal: true,
            readOnlyDirectories: ['/logs'],
        }
        return runtime
    },
})
mock.module('./os.js', { namedExports: { replaceVariables: (...rest) => calls.push(rest) } })
const { default: createApiContainer } = await import('./createApiContainer.js')

test('API compose generation receives read-only mounts and excludes logs in builds', () => {
    const params = {
        composeFile: '/tmp/apiCompose.yaml',
        deterministicPort: 42000,
        home: '/sample',
        processPath: '/sample/application/collectorApi',
    }
    createApiContainer(params)
    assert.match(calls[0][2].apiReadOnlyMounts, /read_only: true/)
    createApiContainer({
        ...params,
        localBuild: true,
    })
    assert.equal(calls[1][2].apiReadOnlyMounts, '')
    assert.equal(calls[1][2].processIsBuild, true)
})
