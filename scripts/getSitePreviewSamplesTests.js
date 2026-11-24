import assert from 'assert/strict'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import getSitePreviewSamples from './getSitePreviewSamples.js'
import {
    deleteFile,
    writeFile,
} from './os.js'

test('loads JSON samples by semantic type and preserves complete menu samples', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'sitePreviewSamples'))
    t.after(() => deleteFile(directory))
    writeFile(join(directory, 'cardCollections', 'cardCollection2.json'), '{"cards":[]}')
    writeFile(join(directory, 'cardCollections', 'cardCollection1.json'), '{"heading":{"title":"Lorem"}}')
    writeFile(join(directory, 'cardCollections', 'temp'), '')
    writeFile(join(directory, 'copyrights', 'copyright1.json'), '"© Example Company. All rights reserved."')
    writeFile(join(directory, 'menuItems', 'menu02.json'), '{"menuItems":[{"children":[{"title":"Ipsum"}]}],"menuKind":"megaMenu"}')
    writeFile(join(directory, 'menuItems', 'menu01.json'), '{"menuItems":[{"title":"Lorem"}]}')

    writeFile(join(directory, 'logos', 'logo01.json'), '{"logo":"/media/preview/logos/lorem.webp"}')

    const samples = getSitePreviewSamples(directory)
    assert.deepEqual(samples.cards, [
        { heading: { title: 'Lorem' } },
        { cards: [] },
    ])
    assert.deepEqual(samples.menus, [
        { menuItems: [{ title: 'Lorem' }] },
        {
            menuItems: [{ children: [{ title: 'Ipsum' }] }],
            menuKind: 'megaMenu',
        },
    ])
    assert.deepEqual(samples.copyright, ['© Example Company. All rights reserved.'])
    assert.deepEqual(samples.logos, [{ logo: '/media/preview/logos/lorem.webp' }])
    assert.equal(Object.hasOwn(samples, 'layout'), false)
})
