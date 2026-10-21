import assert from 'assert/strict'
import { test } from 'node:test'
import removeIdeWelcomeEditors from './removeIdeWelcomeEditors.js'

test('removes Welcome while preserving other tabs and remapping tab indices', () => {
    const group = {
        editors: [
            { id: 'workbench.editors.gettingStartedInput' },
            {
                id: 'file',
                value: 'preserved',
            },
        ],
        id: 0,
        mru: [1, 0],
        preview: 1,
        sticky: 1,
    }
    const state = {
        'editorpart.state': {
            activeGroup: 0,
            serializedGrid: {
                root: {
                    data: [{
                        data: group,
                        type: 'leaf',
                    }],
                    type: 'branch',
                },
            },
        },
    }
    removeIdeWelcomeEditors(state)
    assert.deepEqual(group.editors, [{
        id: 'file',
        value: 'preserved',
    }])
    assert.deepEqual(group.mru, [0])
    assert.equal(group.preview, 0)
    assert.equal(group.sticky, 0)
    assert.equal(state['editorpart.state'].activeGroup, 0)
    const result = JSON.stringify(state)
    assert.equal(JSON.stringify(removeIdeWelcomeEditors(state)), result)
})

test('accepts missing editor layout', () => {
    assert.deepEqual(removeIdeWelcomeEditors({}), {})
})
