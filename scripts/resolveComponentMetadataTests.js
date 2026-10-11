import assert from 'assert/strict'
import test from 'node:test'
import resolveComponentMetadata from './resolveComponentMetadata.js'

test('resolveComponentMetadata identifies mapped part and core components', () => {
    assert.deepEqual(resolveComponentMetadata('/work/src/blog/panel/admin/post/item.jsx'), {
        component: 'item',
        part: 'blog',
        type: 'post',
    })
    assert.deepEqual(resolveComponentMetadata('/work/src/parts/blog/parts/post/card.jsx?import'), {
        component: 'card',
        part: 'blog',
        type: 'post',
    })
    assert.deepEqual(resolveComponentMetadata('/home/dev/site/pageParts/header/logo.jsx'), {
        component: 'logo',
        part: 'core',
        type: undefined,
    })
    assert.equal(resolveComponentMetadata('/work/src/blog/panel/admin/post/data.js'), null)
})
