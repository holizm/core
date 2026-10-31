import assert from 'assert/strict'
import fs from 'fs'
import path from 'path'
import test from 'node:test'
import createThemeStyleEntries from './createThemeStyleEntries.js'

test('createThemeStyleEntries writes one scoped style entry per theme', t => {
    const repo = 'themeStyleEntriesTest'
    const output = path.join('/tmp', repo)
    t.after(() => fs.rmSync(output, {
        force: true,
        recursive: true,
    }))
    createThemeStyleEntries({
        multiThemed: true,
        process: 'site',
        repo,
        themeDirectories: ['theme01', 'theme12', '../siteThemes/theme01'],
    })
    const styles = path.join(output, 'site', 'themeStyles')
    assert.deepEqual(fs.readdirSync(styles).sort(), ['theme01.css', 'theme12.css', 'themecore01.css'])
    assert.match(fs.readFileSync(path.join(styles, 'theme12.css'), 'utf8'), /themes\/12\/style\.css/)
    assert.match(fs.readFileSync(path.join(styles, 'themecore01.css'), 'utf8'), /themes\/core01\/style\.css/)
})

test('single sites receive their complete CSS entry before container startup and watch sync', t => {
    const source = fs.mkdtempSync(path.join('/tmp', 'singleSiteStyleSource'))
    const repo = path.basename(source)
    const output = path.join('/tmp', repo, 'site', 'style.css')
    t.after(() => fs.rmSync(source, {
        force: true,
        recursive: true,
    }))
    const params = {
        multiThemed: false,
        process: 'site',
        processPath: source,
        repo,
    }
    fs.writeFileSync(path.join(source, 'style.css'), `@import './styles/theme.css';\n@import './styles/menu.css';\n`)
    fs.mkdirSync(path.dirname(output), { recursive: true })
    fs.writeFileSync(output, '')
    createThemeStyleEntries(params)
    assert.equal(fs.readFileSync(output, 'utf8'), fs.readFileSync(path.join(source, 'style.css'), 'utf8'))
    fs.writeFileSync(path.join(source, 'style.css'), `@import './styles/updated.css';\n`)
    createThemeStyleEntries(params)
    assert.equal(fs.readFileSync(output, 'utf8'), fs.readFileSync(path.join(source, 'style.css'), 'utf8'))
})
