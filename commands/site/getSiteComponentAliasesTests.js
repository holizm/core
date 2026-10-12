import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSiteComponentAliases from './getSiteComponentAliases.js'

test('getSiteComponentAliases maps core and page components to generated barrels', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'getSiteComponentAliases'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const coreDirectory = path.join(directory, 'coreFunctions')
    const pageDirectory = path.join(directory, 'pageParts', 'home')
    fs.mkdirSync(coreDirectory, { recursive: true })
    fs.mkdirSync(pageDirectory, { recursive: true })
    fs.writeFileSync(path.join(coreDirectory, 'sample.js'), 'export default value => value\n')
    fs.writeFileSync(path.join(pageDirectory, 'title.jsx'), `export default () => 'Title'\n`)
    const aliases = getSiteComponentAliases(directory, true)
    assert.equal(aliases.coreSample, path.join(directory, 'coreBarrels', 'coreFunctions', 'sample'))
    assert.equal(aliases.homeTitle, path.join(directory, 'coreBarrels', 'pageParts', 'home', 'title'))
    assert.match(fs.readFileSync(path.join(directory, 'coreBarrels', 'coreFunctions', 'sample.js'), 'utf8'), /export \{ default \}/)
})
