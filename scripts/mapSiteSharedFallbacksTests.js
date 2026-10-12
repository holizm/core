import assert from 'assert/strict'
import { randomBytes } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import mapSiteSharedFallbacks from './mapSiteSharedFallbacks.js'

test('mapSiteSharedFallbacks copies core templates into the composed page parts', t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'siteFallbackSources'))
    const repo = `siteFallbacks${randomBytes(6).toString('hex')}`
    const output = path.join(os.tmpdir(), repo)
    t.after(() => fs.rmSync(home, { force: true, recursive: true }))
    t.after(() => fs.rmSync(output, { force: true, recursive: true }))
    const source = path.join(home, 'core', 'site')
    fs.mkdirSync(source, { recursive: true })
    for (const name of ['breadcrumb', 'pagination', 'richText']) {
        fs.writeFileSync(path.join(source, `${name}Template.jsx`), `export default '${name}'\n`)
    }
    const volumes = []
    mapSiteSharedFallbacks({
        addVolume: (...args) => volumes.push(args),
        containerHome: '/container',
        home,
        process: 'site',
        repo,
    })
    const fallbackPath = path.join(output, 'site', 'sharedFallbacks')
    assert.equal(fs.readFileSync(path.join(fallbackPath, 'breadcrumb.jsx'), 'utf8'), "export default 'breadcrumb'\n")
    assert.deepEqual(volumes, [[fallbackPath, `/container/${repo}/site/src/pageParts/sharedFallbacks`]])
})
