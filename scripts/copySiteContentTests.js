import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import copySiteContent from './copySiteContent.js'

test('copySiteContent includes markdown and excludes noncontent assets', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'copySiteContent'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const source = path.join(home, 'articles')
    const processPath = path.join(source, 'site')
    const build = path.join(home, 'build')
    fs.mkdirSync(processPath, { recursive: true })
    fs.mkdirSync(path.join(source, 'guides'), { recursive: true })
    fs.mkdirSync(path.join(source, 'site', 'localization'), { recursive: true })
    fs.mkdirSync(path.join(source, 'node_modules'))
    fs.writeFileSync(path.join(processPath, 'contentSource'), 'articles')
    fs.writeFileSync(path.join(source, 'readme.md'), '# Welcome')
    fs.writeFileSync(path.join(source, 'guides', 'start.mdx'), '# Start')
    fs.writeFileSync(path.join(source, 'site', 'localization', 'en.json'), '{}')
    fs.writeFileSync(path.join(source, 'site', 'page.md'), '# Not content')
    fs.writeFileSync(path.join(source, 'logo.png'), 'image')
    fs.writeFileSync(path.join(source, 'node_modules', 'hidden.md'), '# Hidden')
    copySiteContent({ containerHome: '/container', home, processBuildDir: build, processPath })
    const content = path.join(build, 'content')
    assert.equal(fs.existsSync(path.join(content, 'readme.md')), true)
    assert.equal(fs.existsSync(path.join(content, 'guides', 'start.mdx')), true)
    assert.equal(fs.existsSync(path.join(content, 'site')), false)
    assert.equal(fs.existsSync(path.join(content, 'logo.png')), false)
    assert.equal(fs.existsSync(path.join(content, 'node_modules')), false)
})
