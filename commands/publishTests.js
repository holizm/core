import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

const calls = []
const transfers = []
const builds = []
let failInstall = false
const params = {
    isApi: true,
    isPanel: false,
    isSite: false,
    process: 'api',
    processBuildDir: '/tmp/exampleBuild/example/api',
    repo: 'example',
    settingsOverridePath: '/tmp/localSettingsOverride.json',
}
const previousBuildSetting = process.env.publishWithoutBuild
process.env.publishWithoutBuild = 'true'
const empty = () => {}
mock.module('../scripts/terminal.js', { namedExports: {
    clear: empty,
    runStreaming: async command => { transfers.push(command) },
} })
mock.module('../scripts/logger.js', { namedExports: {
    divide: empty,
    errorAndExit: message => { throw new Error(message) },
    info: empty,
} })
for (const [file, value] of [
    ['build', async options => {
        builds.push(options)
        return params
    }],
    ['extract', () => params],
    ['getExistingBuild', () => params],
    ['getInstance', async () => ({ serverDirectory: 'deployment' })],
    ['getSiteContentSource', () => null],
    ['getApiIamSettings', () => { throw new Error('localIamSettingsRead') }],
    ['initializePublishedSettingsOverride', async () => { calls.push('localSettingsCopied') }],
    ['isFile', () => true],
    ['resolvePublishDomain', () => 'example.com'],
    ['validatePublishArtifact', empty],
]) {
    mock.module(`../scripts/${file}.js`, { defaultExport: value })
}
mock.module('../scripts/runOnServer.js', {
    defaultExport: async (domain, command) => {
        calls.push(command)
        if (failInstall && command.includes('/commands/installPackages')) throw new Error('installation failed')
    },
})
mock.module('../scripts/startPublishedProcess.js', {
    defaultExport: async () => calls.push('restart'),
})

test('API publish restores modules in the installation request before restarting', async () => {
    await import('./publish?successfulInstall')
    const installation = calls.find(command => command.includes('/commands/installPackages'))
    assert.ok(installation.includes('trap restorePlatformModules EXIT'))
    assert.ok(installation.includes('/tmp/example/api/api.zip'))
    assert.ok(installation.includes('$HOME/deployment/api/node_modules'))
    assert.ok(calls.indexOf('restart') > calls.indexOf(installation))
})

test('API publication transfers only the build archive and never updates server settings from local data', () => {
    assert.deepEqual(transfers, ['serverCopy /tmp/exampleBuild/example/api/api.zip example.com:/tmp/example/api/api.zip'])
    assert.equal(calls.includes('localSettingsCopied'), false)
    assert.equal(calls.some(command => command.includes('updateIamSettings')), false)
    assert.equal(calls.some(command => /iamSettings\.json|settingsOverride\.json/.test(command)
        && !command.startsWith('find ')), false)
})

test('a fresh API build also publishes code without transferring runtime settings', async () => {
    calls.length = 0
    transfers.length = 0
    process.env.publishWithoutBuild = 'false'
    await import('./publish?freshBuild')
    assert.equal(builds.length, 1)
    assert.equal(builds[0].localBuild, true)
    assert.equal(transfers.length, 1)
    assert.ok(transfers[0].endsWith('/api.zip'))
    assert.equal(calls.includes('localSettingsCopied'), false)
    assert.equal(calls.some(command => command.includes('updateIamSettings')), false)
})

test('failed publication preserves the recovery archive and does not restart', async () => {
    calls.length = 0
    failInstall = true
    await assert.rejects(import('./publish?failedInstall'), /installation failed/)
    assert.equal(calls.includes('restart'), false)
    assert.equal(calls.includes('rm -rf /tmp/example/api'), false)
    if (previousBuildSetting === undefined) delete process.env.publishWithoutBuild
    else process.env.publishWithoutBuild = previousBuildSetting
})
