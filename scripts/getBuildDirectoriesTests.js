import assert from 'assert/strict'
import { tmpdir } from 'os'
import test from 'node:test'
import getBuildDirectories from './getBuildDirectories.js'

test('getBuildDirectories keeps process output under one temporary build root', () => {
    const result = getBuildDirectories({ pascalizedProcess: 'AdminApi', process: 'adminApi', repo: 'sample' })
    assert.equal(result.buildDir, `${tmpdir()}/sampleAdminApiBuild`)
    assert.equal(result.processBuildDir, `${result.buildDir}/sample/adminApi`)
})
