import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import ensureGitConfig from './ensureGitConfig.js'

test('ensureGitConfig accepts an isolated signed-commit configuration', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gitConfig'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const previousConfig = process.env.GIT_CONFIG_GLOBAL
    process.env.GIT_CONFIG_GLOBAL = path.join(directory, 'config')
    try {
        for (const [key, value] of [
            ['user.name', 'Test User'],
            ['user.email', 'test@example.com'],
            ['gpg.format', 'ssh'],
            ['user.signingkey', '/tmp/testKey'],
            ['commit.gpgsign', 'true'],
        ]) execFileSync('git', ['config', '--global', key, value])
        ensureGitConfig()
        assert.equal(execFileSync('git', ['config', '--global', '--get', 'pull.twohead'], { encoding: 'utf8' }).trim(), 'ort')
    }
    finally {
        if (previousConfig === undefined) delete process.env.GIT_CONFIG_GLOBAL
        else process.env.GIT_CONFIG_GLOBAL = previousConfig
    }
})
