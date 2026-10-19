import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

const calls = []
let failInstall = false
const params = {
    isApi: true,
    isPanel: false,
    isSite: false,
    process: 'api',
    processBuildDir: '/tmp/exampleBuild/example/api',
    repo: 'example',
}
const previousBuildSetting = process.env.publishWithoutBuild
process.env.publishWithoutBuild = 'true'
const empty = () => {}
mock.module('../scripts/terminal.js', { namedExports: {
    clear: empty,
    runStreaming: async () => {},
} })
mock.module('../scripts/logger.js', { namedExports: {
    divide: empty,
    errorAndExit: message => { throw new Error(message) },
    info: empty,
} })
for (const [file, value] of [
    ['build', async () => params],
    ['extract', () => params],
    ['getExistingBuild', () => params],
    ['getInstance', async () => ({ serverDirectory: 'deployment' })],
    ['getSiteContentSource', () => null],
    ['initializePublishedIamSettings', async () => {}],
    ['initializePublishedSettingsOverride', async () => {}],
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

test('failed publication preserves the recovery archive and does not restart', async () => {
    calls.length = 0
    failInstall = true
    await assert.rejects(import('./publish?failedInstall'), /installation failed/)
    assert.equal(calls.includes('restart'), false)
    assert.equal(calls.includes('rm -rf /tmp/example/api'), false)
    if (previousBuildSetting === undefined) delete process.env.publishWithoutBuild
    else process.env.publishWithoutBuild = previousBuildSetting
})
