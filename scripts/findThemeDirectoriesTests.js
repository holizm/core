import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findThemeDirectories from './findThemeDirectories.js'

test('findThemeDirectories finds and numerically orders theme directories', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'themeDirectories'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    for (const name of ['theme10', 'theme2', 'theme01', 'themes3', 'themeA']) {
        fs.mkdirSync(path.join(root, name))
    }
    fs.writeFileSync(path.join(root, 'theme3'), '')
    assert.deepEqual(findThemeDirectories(root), ['theme01', 'theme2', 'theme10'])
})

test('core themes are all discovered directly without symbolic links', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coreThemes'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const runnable = path.join(root, 'sampleThemes')
    const catalog = path.join(root, 'siteThemes')
    fs.mkdirSync(path.join(runnable, 'theme001'), { recursive: true })
    fs.mkdirSync(path.join(catalog, 'theme001'), { recursive: true })
    fs.mkdirSync(path.join(catalog, 'theme032'))
    fs.mkdirSync(path.join(catalog, 'theme100'))
    fs.mkdirSync(path.join(catalog, 'other'))
    assert.deepEqual(findThemeDirectories(runnable, catalog), [
        '../siteThemes/theme001',
        '../siteThemes/theme032',
        '../siteThemes/theme100',
        'theme001',
    ])
    assert.deepEqual(findThemeDirectories(runnable), ['theme001'])
})

test('a themed runnable without custom themes still includes the entire core catalog', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coreOnlyThemes'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const runnable = path.join(root, 'sampleThemes')
    const catalog = path.join(root, 'siteThemes')
    fs.mkdirSync(runnable)
    fs.mkdirSync(path.join(catalog, 'theme032'), { recursive: true })
    fs.symlinkSync('../siteThemes/theme032', path.join(runnable, 'coreTheme032'))
    assert.deepEqual(findThemeDirectories(runnable, catalog), ['../siteThemes/theme032'])
})
