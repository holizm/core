import assert from 'assert/strict'
import test from 'node:test'
import getSiteRoutePath from './getSiteRoutePath.js'

test('getSiteRoutePath handles representative cases', () => {
    assert.deepEqual(getSiteRoutePath({ dependency: 'blog', relative: 'post/index' }), {
        isSharedRoute: false,
        routePath: 'blog/post/index',
    })
    assert.deepEqual(getSiteRoutePath({ dependency: 'blog', relative: 'dashboard/index' }), {
        isSharedRoute: true,
        routePath: 'dashboard/index',
    })
})
