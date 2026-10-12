import assert from 'assert/strict'
import test from 'node:test'
import getApiRepo from './getApiRepo.js'

test('getApiRepo maps a themes repository to its backing repository', () => {
    assert.equal(getApiRepo('holismThemes'), 'holism')
    assert.equal(getApiRepo('holism'), 'holism')
    assert.equal(getApiRepo('themesArchive'), 'themesArchive')
})
