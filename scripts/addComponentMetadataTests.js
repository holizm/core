import assert from 'assert/strict'
import { transformSync } from '@babel/core'
import test from 'node:test'
import addComponentMetadata from './addComponentMetadata.js'

const transform = (code, id) => transformSync(code, {
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['jsx'] },
    plugins: [[addComponentMetadata, { id }]],
}).code

test('addComponentMetadata adds component metadata without replacing explicit attributes', () => {
    const id = '/work/src/blog/panel/admin/post/card.jsx'
    const result = transform('export default props => <button type="submit" {...props} />', id)
    assert.match(result, /component="card"/)
    assert.match(result, /part="blog"/)
    assert.match(result, /data-type="post"/)
    assert.match(result, /type="submit"/)
    assert.equal((result.match(/type="submit"/g) || []).length, 1)
})

test('addComponentMetadata leaves nested component markup without extra metadata', () => {
    const id = '/work/src/blog/panel/admin/post/card.jsx'
    const result = transform('export default () => <div><span /></div>', id)
    assert.equal((result.match(/component="card"/g) || []).length, 1)
})
