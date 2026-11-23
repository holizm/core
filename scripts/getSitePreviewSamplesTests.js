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

test('loads JSON samples by semantic type and preserves the menu forest', async t => {
    const directory = mkdtempSync(join(tmpdir(), 'sitePreviewSamples'))
    t.after(() => deleteFile(directory))
    writeFile(join(directory, 'cardCollections', 'cardCollection2.json'), '{"cards":[]}')
    writeFile(join(directory, 'cardCollections', 'cardCollection1.json'), '{"heading":{"title":"Lorem"}}')
    writeFile(join(directory, 'cardCollections', 'temp'), '')
    writeFile(join(directory, 'menuItems.json'), '[{"children":[],"hasChildren":false}]')

    const samples = getSitePreviewSamples(directory)
    assert.deepEqual(samples.cards, [
        { heading: { title: 'Lorem' } },
        { cards: [] },
    ])
    assert.deepEqual(samples.menuItems, [{
        children: [],
        hasChildren: false,
    }])
    assert.deepEqual(samples.layout, [])
})
