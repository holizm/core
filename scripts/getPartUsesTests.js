import assert from 'assert/strict'
import test from 'node:test'
import getPartUses from './getPartUses.js'

test('getPartUses reads direct uses entries and ignores nested sections', () => {
    const source = [
        'name orders',
        'uses',
        '    products',
        '    pricing required',
        '        nested ignored',
        '    products',
        'other',
        '    accounts',
    ].join('\n')
    assert.deepEqual(getPartUses(source), ['products', 'pricing'])
    assert.deepEqual(getPartUses('name orders'), [])
})
