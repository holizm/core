import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findNonExistentPaths from './findNonExistentPaths.js'

test('findNonExistentPaths reports missing Compose volume sources', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'composePaths'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const existing = path.join(directory, 'existing')
    const missing = path.join(directory, 'missing')
    fs.mkdirSync(existing)
    const composeFile = path.join(directory, 'compose.yaml')
    fs.writeFileSync(composeFile, `volumes:\n    - ${existing}:/data\n    - ${missing}:/missing\n`)
    const previousLog = console.log
    const warnings = []
    console.log = value => warnings.push(value)
    try {
        findNonExistentPaths({ composeFile })
    }
    finally {
        console.log = previousLog
    }
    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /missing/)
})
