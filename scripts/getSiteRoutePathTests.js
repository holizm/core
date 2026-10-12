import assert from 'assert/strict'
import test from 'node:test'
import getSiteRoutePath from './getSiteRoutePath.js'

test('getSiteRoutePath prefixes part routes and preserves shared dashboard routes', () => {
    assert.deepEqual(getSiteRoutePath({
        dependency: 'blog',
        relative: 'post/example',
    }), {
        isSharedRoute: false,
        routePath: 'blog/post/example',
    })
    assert.deepEqual(getSiteRoutePath({
        dependency: 'analytics',
        relative: 'dashboard/index',
    }), {
        isSharedRoute: true,
        routePath: 'dashboard/index',
    })
})
