import assert from 'assert/strict'
import fs from 'fs'
import path from 'path'
import test from 'node:test'
import createThemeStyleEntries from './createThemeStyleEntries.js'

test('createThemeStyleEntries writes one scoped style entry per theme', t => {
    const repo = 'themeStyleEntriesTest'
    const output = path.join('/tmp', repo)
    t.after(() => fs.rmSync(output, { recursive: true, force: true }))
    createThemeStyleEntries({ multiThemed: false, process: 'site', repo, themeDirectories: ['theme01'] })
    assert.equal(fs.existsSync(output), false)
    createThemeStyleEntries({ multiThemed: true, process: 'site', repo, themeDirectories: ['theme01', 'theme12'] })
    const styles = path.join(output, 'site', 'themeStyles')
    assert.deepEqual(fs.readdirSync(styles).sort(), ['theme01.css', 'theme12.css'])
    assert.match(fs.readFileSync(path.join(styles, 'theme12.css'), 'utf8'), /themes\/12\/style\.css/)
})
