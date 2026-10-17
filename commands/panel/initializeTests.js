import assert from 'assert/strict'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'

test('container initialization creates a missing public override and preserves an existing one', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'panelInitialize'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const options = {
        env: {
            ...process.env,
            home: directory,
            process: 'userPanel',
            repo: 'phoneAi',
        },
    }
    const command = path.join(import.meta.dirname, 'initialize')
    const override = path.join(directory, 'phoneAi/userPanel/public/settingsOverride.json')
    assert.equal(spawnSync('bash', [command], options).status, 0)
    assert.deepEqual(JSON.parse(fs.readFileSync(override, 'utf8')), {})
    assert.equal(fs.existsSync(path.join(directory, 'phoneAi/userPanel/settingsOverride.json')), false)
    fs.writeFileSync(override, '')
    assert.equal(spawnSync('bash', [command], options).status, 0)
    assert.deepEqual(JSON.parse(fs.readFileSync(override, 'utf8')), {})
    fs.writeFileSync(override, '{"panel":{"minimal":true}}')
    assert.equal(spawnSync('bash', [command], options).status, 0)
    assert.equal(fs.readFileSync(override, 'utf8'), '{"panel":{"minimal":true}}')
})
