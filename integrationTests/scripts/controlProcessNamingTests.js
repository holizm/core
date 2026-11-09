import assert from 'assert/strict'
import { tmpdir } from 'os'
import test from 'node:test'
import getBuildDirectories from '../../scripts/getBuildDirectories.js'
import getLocalHost from '../../scripts/getLocalHost.js'
import getProcessRole from '../../scripts/getProcessRole.js'
import isControlPanel from '../../scripts/isControlPanel.js'
import isControlProcess from '../../scripts/isControlProcess.js'
import pascalize from '../../scripts/pascalize.js'

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
