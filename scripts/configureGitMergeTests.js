import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import configureGitMerge from './configureGitMerge.js'

test('configureGitMerge writes the expected merge choices to an isolated config', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gitMerge'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const previousConfig = process.env.GIT_CONFIG_GLOBAL
    process.env.GIT_CONFIG_GLOBAL = path.join(directory, 'config')
    try {
        configureGitMerge()
        const getConfig = key => execFileSync('git', ['config', '--global', '--get', key], { encoding: 'utf8' }).trim()
        assert.equal(getConfig('pull.rebase'), 'false')
        assert.equal(getConfig('pull.ff'), 'true')
        assert.equal(getConfig('pull.twohead'), 'ort')
    }
    finally {
        if (previousConfig === undefined) delete process.env.GIT_CONFIG_GLOBAL
        else process.env.GIT_CONFIG_GLOBAL = previousConfig
    }
})
