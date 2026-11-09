import assert from 'assert/strict'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import createSiteRenderers from './createSiteRenderers.js'
import {
    deleteFile,
    getContent,
    writeFile,
} from './os.js'

test('only composed parts contribute renderers and the owning site overrides them last', () => {
    const home = mkdtempSync(join(tmpdir(), 'siteRenderers'))
    const repo = home.split('/').at(-1)
    const source = `/tmp/${repo}/site/configuredRenderers.js`
    writeFile(join(home, 'albums/site/functions/contentRenderers.jsx'), 'export default {}')
    writeFile(join(home, repo, 'catalog/site/functions/contentRenderers.jsx'), 'export default {}')
    writeFile(join(home, repo, 'site/parts/shared/contentRenderers.jsx'), 'export default {}')
    const volumes = []
    createSiteRenderers({
        addVolume: (...rest) => volumes.push(rest),
        containerHome: '/container',
        dependencies: ['missing', 'catalog', 'albums', 'albums'],
        home,
        process: 'site',
        processPath: join(home, repo, 'site'),
        repo,
    })
    const content = getContent(source)
    assert.equal(content.match(/import albumsRenderers/g).length, 1)
    assert.ok(content.indexOf('...albumsRenderers') < content.indexOf('...catalogRenderers'))
    assert.ok(content.indexOf('...catalogRenderers') < content.indexOf('...siteRenderers'))
    assert.equal(content.includes('missing'), false)
    assert.deepEqual(volumes, [[source, `/container/${repo}/site/src/core/configuredRenderers.js`]])
    deleteFile(source)
})

test('sites without optional declarations receive an empty registry', () => {
    const home = mkdtempSync(join(tmpdir(), 'emptyRenderers'))
    const repo = home.split('/').at(-1)
    createSiteRenderers({
        addVolume: () => {},
        containerHome: '/container',
        home,
        process: 'site',
        processPath: join(home, 'site'),
        repo,
    })
    const source = `/tmp/${repo}/site/configuredRenderers.js`
    assert.equal(getContent(source).trim(), 'export default {\n}')
    deleteFile(source)
})
