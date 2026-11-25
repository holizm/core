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
    writeFile(join(directory, 'brands', 'brand1.json'), '"Alder & Vale"')
    writeFile(join(directory, 'cards', 'card1.json'), '{"text":"Standalone card"}')
    writeFile(join(directory, 'dataLoaders', 'dataLoader1.json'), '[{"title":"Loaded item"}]')
    writeFile(join(directory, 'cardCollections', 'cardCollection2.json'), '{"cards":[]}')
    writeFile(join(directory, 'cardCollections', 'cardCollection1.json'), '{"heading":{"title":"Lorem"}}')
    writeFile(join(directory, 'cardCollections', 'temp'), '')
    writeFile(join(directory, 'copyrights', 'copyright1.json'), '"© Example Company. All rights reserved."')
    writeFile(join(directory, 'menuItems', 'menu02.json'), '{"menuItems":[{"children":[{"title":"Ipsum"}]}],"menuKind":"megaMenu"}')
    writeFile(join(directory, 'menuItems', 'menu01.json'), '{"menuItems":[{"title":"Lorem"}]}')

    writeFile(join(directory, 'logos', 'logo01.json'), '{"logo":"/media/preview/logos/lorem.webp"}')

    writeFile(join(directory, 'slogans', 'slogan1.json'), '"Make room for better."')
    writeFile(join(directory, 'urls', 'url1.json'), '"/lorem"')
    writeFile(join(directory, 'links', 'link1.json'), '{"url":"/lorem"}')
    writeFile(join(directory, 'locations', 'location1.json'), '{"city":"Lorem"}')
    const samples = getSitePreviewSamples(directory)
    assert.deepEqual(samples.brand, ['Alder & Vale'])
    assert.deepEqual(samples.slogan, ['Make room for better.'])
    assert.deepEqual(samples.url, ['/lorem'])
    assert.deepEqual(samples.link, [{ url: '/lorem' }])
    assert.deepEqual(samples.location, [{ city: 'Lorem' }])
    assert.deepEqual(samples.card, [{ text: 'Standalone card' }])
    assert.deepEqual(samples.dataLoader, [[{ title: 'Loaded item' }]])
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
