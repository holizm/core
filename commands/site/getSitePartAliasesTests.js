import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSitePartAliases from './getSitePartAliases.js'

test('getSitePartAliases generates aliases for default-exported part files', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sitePartAliases'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    assert.deepEqual(getSitePartAliases(root), {})
    const source = path.join(root, 'parts', 'blog', 'parts', 'post')
    const barrel = path.join(root, 'partBarrels', 'blog')
    fs.mkdirSync(source, { recursive: true })
    fs.mkdirSync(barrel, { recursive: true })
    fs.writeFileSync(path.join(source, 'card.jsx'), 'export default props => props.title\n')
    fs.writeFileSync(path.join(source, 'named.js'), 'export const named = 1\n')
    assert.deepEqual(getSitePartAliases(root), {
        blogPostCard: './src/partBarrels/blog/postCard',
    })
    assert.equal(fs.readFileSync(path.join(barrel, 'postCard.jsx'), 'utf8'),
        "export { default } from '../../parts/blog/parts/post/card.jsx'\n")
})
