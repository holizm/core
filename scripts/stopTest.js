import assert from 'assert/strict'
import {
    chmod,
    copyFile,
    mkdtemp,
    readFile,
    rm,
    writeFile,
} from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import stop from './stop.js'

const containers = [
    'holismAdminApi',
    'holismAdminPanel',
    'holismControlApi',
    'holismControlPanel',
    'holismThemesSite',
    'holismThemesSiteApi',
    'holismDatabases',
    'holismCache',
]

const runStop = async params => {
    const directory = await mkdtemp(join(tmpdir(), 'stopTest'))
    const dockerPath = join(directory, 'docker')
    const dockerCallsPath = join(directory, 'calls.json')
    const dockerContainersPath = join(directory, 'containers.json')
    const previousEnv = { ...process.env }
    try {
        await copyFile(new URL('./testFixtures/fakeDocker.js', import.meta.url), dockerPath)
        await chmod(dockerPath, 0o755)
        await writeFile(dockerCallsPath, '')
        await writeFile(dockerContainersPath, JSON.stringify(containers))
        Object.assign(process.env, {
            dockerCallsPath,
            dockerContainersPath,
            PATH: `${directory}:${previousEnv.PATH}`,
        })
        await stop(params)
        const calls = (await readFile(dockerCallsPath, 'utf8')).trim().split('\n').map(line => JSON.parse(line))
        return calls
    }
    finally {
        process.env = previousEnv
        await rm(directory, {
            force: true,
            recursive: true,
        })
    }
}

for (const containerName of containers.slice(0, 6)) {
    test(`restarting ${containerName} preserves sibling and infrastructure containers`, async () => {
        const calls = await runStop({ containerName })
        assert.deepEqual(calls.filter(args => args[0] === 'rm'), [['rm', containerName, '--force']])
        assert.equal(calls.some(args => args[0] === 'system'), false)
    })
}

test('starting a missing container does not stop or prune anything', async () => {
    const calls = await runStop({ containerName: 'missingAdminApi' })
    assert.equal(calls.some(args => ['rm', 'system'].includes(args[0])), false)
})

test('explicit stop patterns retain group matching', async () => {
    const calls = await runStop({ pattern: 'HOLISMADMIN' })
    assert.deepEqual(calls.filter(args => args[0] === 'rm').map(args => args[1]), containers.slice(0, 2))
})

test('explicit stop without a selector still stops all containers', async () => {
    const calls = await runStop()
    assert.deepEqual(calls.filter(args => args[0] === 'rm').map(args => args[1]), containers)
})
