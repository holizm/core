import assert from 'assert/strict'
import { randomBytes } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapNewSiteSharedFallbacks from './mapNewSiteSharedFallbacks.js'

test('mapNewSiteSharedFallbacks copies the selected site templates', t => {
    const siteTemplatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'newSiteTemplates'))
    const repo = `newSiteFallbacks${randomBytes(6).toString('hex')}`
    const output = path.join(os.tmpdir(), repo)
    t.after(() => fs.rmSync(siteTemplatePath, { force: true, recursive: true }))
    t.after(() => fs.rmSync(output, { force: true, recursive: true }))
    for (const name of ['breadcrumb', 'pagination', 'richText']) {
        fs.writeFileSync(path.join(siteTemplatePath, `${name}Template.jsx`), `export default '${name}'\n`)
    }
    const volumes = []
    mapNewSiteSharedFallbacks({
        addVolume: (...args) => volumes.push(args),
        containerHome: '/container',
        process: 'site',
        repo,
        siteTemplatePath,
    })
    const fallbackPath = path.join(output, 'site', 'sharedFallbacks')
    assert.equal(fs.readFileSync(path.join(fallbackPath, 'pagination.jsx'), 'utf8'), "export default 'pagination'\n")
    assert.deepEqual(volumes, [[fallbackPath, `/container/${repo}/site/src/pageParts/sharedFallbacks`]])
})
