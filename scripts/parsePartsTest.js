import assert from 'node:assert/strict'
import test from 'node:test'
import {
    includesPart,
    parseParts,
} from './parseParts.js'

test('parses comma-separated parts', () => {
    assert.deepEqual(parseParts('blog, courses,products'), [
        'blog',
        'courses',
        'products',
    ])
})

test('removes empty, duplicate, and slash-separated input artifacts', () => {
    assert.deepEqual(parseParts('/blog,blog,,courses/'), [
        'blog',
        'courses',
    ])
})

test('matches all parts without a filter and selected parts with a filter', () => {
    assert.equal(includesPart('', 'blog'), true)
    assert.equal(includesPart('blog,courses', 'courses'), true)
    assert.equal(includesPart('blog,courses', 'products'), false)
})
