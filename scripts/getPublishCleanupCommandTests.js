import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getPublishCleanupCommand from './getPublishCleanupCommand.js'

test('getPublishCleanupCommand retains runtime files while removing published output', () => {
    const command = getPublishCleanupCommand('/deploy/adminPanel', true)
    assert.match(command, /^find \/deploy\/adminPanel -mindepth 1 -maxdepth 1 /)
    assert.match(command, /! -name '\.env'/)
    assert.match(command, /! -name 'node_modules'/)
    assert.match(command, /! -name 'tenants'/)
    assert.match(command, /-exec rm -rf \{\} \+$/)
    assert.doesNotMatch(command, /! -name 'dist'/)
    assert.doesNotMatch(command, /! -name 'publicCommon\.json'/)
    const apiCommand = getPublishCleanupCommand('/deploy/adminApi', false)
    assert.match(apiCommand, /! -name 'publicCommon\.json'/)
})

test('publish cleanup removes panel common settings and preserves API common settings', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publishCleanup'))
    const panelPath = path.join(directory, 'adminPanel')
    const apiPath = path.join(directory, 'adminApi')
    const runtimeFiles = ['.env', '.env.production', 'iamSettings.json', 'privateSettings.json', 'connectionStrings.json', 'settingsOverride.json']
    try {
        fs.mkdirSync(panelPath)
        fs.mkdirSync(apiPath)
        for (const processPath of [panelPath, apiPath]) {
            fs.writeFileSync(path.join(processPath, 'publicCommon.json'), '{}')
            fs.writeFileSync(path.join(processPath, 'privateCommon.json'), '{}')
        }
        for (const file of runtimeFiles) {
            fs.writeFileSync(path.join(apiPath, file), `serverOwned:${file}`)
        }
        execFileSync('bash', ['-lc', getPublishCleanupCommand(panelPath, true)])
        execFileSync('bash', ['-lc', getPublishCleanupCommand(apiPath, false)])
        assert.equal(fs.existsSync(path.join(panelPath, 'publicCommon.json')), false)
        assert.equal(fs.existsSync(path.join(panelPath, 'privateCommon.json')), true)
        assert.equal(fs.existsSync(path.join(apiPath, 'publicCommon.json')), true)
        for (const file of runtimeFiles) {
            assert.equal(fs.readFileSync(path.join(apiPath, file), 'utf8'), `serverOwned:${file}`)
        }
    }
    finally {
        fs.rmSync(directory, { force: true, recursive: true })
    }
})
