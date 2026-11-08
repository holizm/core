import assert from 'assert/strict'
import {
    mock,
    test,
} from 'node:test'

let content
const writes = []
mock.module('./isFile.js', { exports: { default: () => content !== undefined } })
mock.module('./logger.js', { exports: {
    divide: () => {},
    success: () => {}
} })
mock.module('./os.js', { exports: {
    getContent: () => content,
    writeFile: (file, value) => {
        content = value
        writes.push(file)
    }
} })
mock.module('./replaceVariables.js', { exports: { default: () => '    Workflow step   \n    \n' } })
const { default: create } = await import('./createCiCd.js')

test('workflow generation preserves indentation and remains unchanged after whitespace normalization', () => {
    const options = {
        home: '/tmp/workflowGeneration',
        process: 'userApi',
        processType: 'api',
        repo: 'application'
    }
    create(options)
    assert.match(content, /^ {4}Workflow step/)
    assert.ok(content.split('\n').every(line => line === line.trimEnd()))
    create(options)
    assert.equal(writes.length, 1)
})
