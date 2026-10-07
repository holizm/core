import assert from 'assert/strict'
import { tmpdir } from 'os'
import test from 'node:test'
import getBuildDirectories from './getBuildDirectories.js'
import getLocalHost from './getLocalHost.js'
import getProcessRole from './getProcessRole.js'
import isControlPanel from './isControlPanel.js'
import isControlProcess from './isControlProcess.js'
import pascalize from './pascalize.js'

test('control process directories derive names and roles from the repository', () => {
    const api = {
        process: 'api',
        repo: 'jzpControl',
    }
    const panel = {
        process: 'panel',
        repo: 'jzpControl',
    }
    assert.equal(isControlProcess(api), true)
    assert.equal(isControlPanel(panel), true)
    assert.equal(getProcessRole('api', true), 'admin')
    assert.equal(getProcessRole('panel', true), 'admin')
    assert.equal(getProcessRole('api', false), null)
    assert.equal(`${api.repo}${pascalize(api.process)}`, 'jzpControlApi')
    assert.equal(`${panel.repo}${pascalize(panel.process)}`, 'jzpControlPanel')
    assert.equal(getBuildDirectories({
        pascalizedProcess: 'Api',
        repo: 'jzpControl',
    }).buildDir, `${tmpdir()}/jzpControlApiBuild`)
})

test('control process hosts preserve the control subdomain', () => {
    const common = {
        domain: 'example.com',
        processPath: '/missing',
        repo: 'jzpControl',
        siteFilePath: '/missing/site',
    }
    assert.equal(getLocalHost({
        ...common,
        process: 'api',
    }), 'api.control.example.local')
    assert.equal(getLocalHost({
        ...common,
        process: 'panel',
    }), 'control.example.local')
})
