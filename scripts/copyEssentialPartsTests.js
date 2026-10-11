import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import copyEssentialParts from './copyEssentialParts.js'

test('copyEssentialParts preserves the core declaration in a process build', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'essentialParts'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const buildDir = path.join(home, 'build')
    const processBuildDir = path.join(home, 'process')
    fs.mkdirSync(path.join(buildDir, 'core'), { recursive: true })
    fs.mkdirSync(path.join(processBuildDir, 'node_modules', 'core'), { recursive: true })
    fs.writeFileSync(path.join(buildDir, 'core', 'essentialParts'), 'globalization\nsettings\n')
    copyEssentialParts({ buildDir, processBuildDir })
    assert.equal(fs.readFileSync(path.join(processBuildDir, 'node_modules', 'core', 'essentialParts'), 'utf8'), 'globalization\nsettings\n')
})
