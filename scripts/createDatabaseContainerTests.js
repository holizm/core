import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

test('database creation uses repository credentials and preserves the shared fallback', async () => {
    let repositorySettings = { database: { password: 'repositoryPassword', user: 'repositoryUser' } }
    let output
    const template = '${databaseUser}:${databasePassword}'
    mock.module('./createRunnableCompass.js', { defaultExport: async () => {} })
    mock.module('./getDeterministicPort.js', { defaultExport: () => 50000 })
    mock.module('./os.js', {
        namedExports: {
            createDirIfNotExists: () => {},
            getContent: path => path.endsWith('/composes/database') ? template : JSON.stringify(
                path.endsWith('/privateCommon.json')
                    ? { database: { password: 'sharedPassword', user: 'sharedUser' } }
                    : repositorySettings,
            ),
            overrideFile: (path, content) => { output = content },
        },
    })
    mock.module('./prepareComposeFile.js', { defaultExport: () => {} })
    mock.module('./terminal.js', { namedExports: { runOnTerminalAsync: async () => '' } })
    const { default: createDatabaseContainer } = await import('./createDatabaseContainer.js')
    const parameters = {
        home: '/tmp/databaseCredentials',
        lowercaseRepo: 'example',
        repo: 'example',
    }
    await createDatabaseContainer(parameters)
    assert.equal(output, 'repositoryUser:repositoryPassword')
    repositorySettings = {}
    await createDatabaseContainer(parameters)
    assert.equal(output, 'sharedUser:sharedPassword')
})
