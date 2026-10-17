import assert from 'assert/strict'
import test from 'node:test'
import getSiteModuleExports from './getSiteModuleExports.js'

test('export-like text inside strings does not create application aliases', () => {
    const result = getSiteModuleExports('const example = `export { ${name} }`; export const actual = 1')
    assert.deepEqual(result.names, ['actual'])
    assert.equal(result.hasDefault, false)
})

test('real default and named exports retain their public names', () => {
    const result = getSiteModuleExports(`export const value = 1; export { value as alias }; export default value`)
    assert.deepEqual(result.names, ['value', 'alias'])
    assert.equal(result.hasDefault, true)
})

test('type-only exports are not generated as runtime default exports', () => {
    const result = getSiteModuleExports('type Value = string; export type { Value }; export interface Item { title: string }; export default () => null')
    assert.deepEqual(result.names, [])
    assert.equal(result.hasDefault, true)
})
