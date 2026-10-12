import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findThemeDirectories from './findThemeDirectories.js'

test('findThemeDirectories finds and numerically orders theme directories', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'themeDirectories'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    for (const name of ['theme10', 'theme2', 'theme01', 'themes3', 'themeA']) {
        fs.mkdirSync(path.join(root, name))
    }
    fs.writeFileSync(path.join(root, 'theme3'), '')
    assert.deepEqual(findThemeDirectories(root), ['theme01', 'theme2', 'theme10'])
})
