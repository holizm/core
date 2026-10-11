import assert from 'assert/strict'
import test from 'node:test'
import getApiUtilityDirectories from './getApiUtilityDirectories.js'

test('getApiUtilityDirectories maps utilities only for admin processes', () => {
    const options = { containerHome: '/runtime', process: 'adminApi', repo: 'sample' }
    const directories = getApiUtilityDirectories(options)
    assert.equal(directories.length, 4)
    assert.deepEqual(directories[0], ['/tmp/sample/adminApiUtilities/generation', '/runtime/generation'])
    assert.deepEqual(getApiUtilityDirectories({ ...options, process: 'siteApi' }), [])
})
