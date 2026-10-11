import assert from 'assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import findThemeDirectories from './findThemeDirectories.js'

test('findThemeDirectories returns only theme directories in numeric order', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'themeDirectories'))
    try {
        for (const name of ['theme10', 'theme2', 'theme01', 'themes', 'site']) mkdirSync(path.join(directory, name))
        assert.deepEqual(findThemeDirectories(directory), ['theme01', 'theme2', 'theme10'])
    }
    finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
