import assert from 'assert/strict'
import test from 'node:test'
import componentMetadataVite from './componentMetadataVite.js'

test('componentMetadataVite transforms mapped components and ignores unrelated files', () => {
    const plugin = componentMetadataVite()
    const result = plugin.transform('export default props => <div {...props} />', '/work/src/blog/panel/admin/post/card.jsx')
    assert.equal(plugin.enforce, 'pre')
    assert.equal(plugin.name, 'componentMetadata')
    assert.match(result.code, /component="card"/)
    assert.match(result.code, /part="blog"/)
    assert.match(result.code, /type="post"/)
    assert.ok(result.code.indexOf('type="post"') < result.code.indexOf('{...props}'))
    assert.equal(result.map, null)
    assert.equal(plugin.transform('export default 1', '/work/other.js'), null)
})
