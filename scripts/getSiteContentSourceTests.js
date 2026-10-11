import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSiteContentSource from './getSiteContentSource.js'

test('getSiteContentSource resolves a declared repository and validates it', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'siteContentSource'))
    t.after(() => fs.rmSync(home, { recursive: true, force: true }))
    const processPath = path.join(home, 'site')
    fs.mkdirSync(processPath)
    const params = { containerHome: '/container', home, processPath }
    assert.equal(getSiteContentSource(params), null)
    fs.writeFileSync(path.join(processPath, 'contentSource'), 'articles\n')
    assert.throws(() => getSiteContentSource(params), /does not exist/)
    fs.mkdirSync(path.join(home, 'articles'))
    assert.deepEqual(getSiteContentSource(params), {
        repository: 'articles',
        source: path.join(home, 'articles'),
        target: '/container/articlesContent',
    })
    fs.writeFileSync(path.join(processPath, 'contentSource'), '../articles')
    assert.throws(() => getSiteContentSource(params), /Invalid site content source/)
})
