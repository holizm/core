import assert from 'assert/strict'
import test from 'node:test'
import resolveSiteRouteClass from './resolveSiteRouteClass.js'

test('resolveSiteRouteClass handles representative cases', () => {
    assert.equal(resolveSiteRouteClass('/project/site/pages/post/index.jsx'), 'page')
    assert.equal(resolveSiteRouteClass('/project/theme05/pages/post/layout.jsx?import'), 'layout')
    assert.equal(resolveSiteRouteClass('/project/src/routes/post/index.tsx'), 'page')
    assert.equal(resolveSiteRouteClass('/project/site/parts/post/index.jsx'), null)
})
