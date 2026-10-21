import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import configureIdeLayout from './configureIdeLayout.js'

test('updates saved workspaces without changing unrelated state on repeated runs', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'ideLayout'))
    try {
        await configureIdeLayout(directory)
        for (const name of ['first', 'second']) {
            const storage = join(directory, 'workspaceStorage', name)
            mkdirSync(storage, { recursive: true })
            const database = new DatabaseSync(join(storage, 'state.vscdb'))
            try {
                database.exec('CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)')
                const insert = database.prepare('INSERT INTO ItemTable (key, value) VALUES (?, ?)')
                insert.run('workbench.auxiliaryBar.hidden', 'false')
                insert.run('custom', 'preserved')
                insert.run('memento/workbench.parts.editor', JSON.stringify({
                    'editorpart.state': {
                        serializedGrid: {
                            root: {
                                data: {
                                    editors: [{ id: 'workbench.editors.gettingStartedInput' }],
                                    mru: [0],
                                    preview: 0,
                                },
                                type: 'leaf',
                            },
                        },
                    },
                }))
            } finally {
                database.close()
            }
        }
        await configureIdeLayout(directory)
        await configureIdeLayout(directory)
        for (const name of ['first', 'second']) {
            const database = new DatabaseSync(join(directory, 'workspaceStorage', name, 'state.vscdb'))
            try {
                const query = database.prepare('SELECT value FROM ItemTable WHERE key = ?')
                assert.equal(query.get('workbench.auxiliaryBar.hidden').value, 'true')
                assert.equal(query.get('custom').value, 'preserved')
                const state = JSON.parse(query.get('memento/workbench.parts.editor').value)
                assert.deepEqual(state['editorpart.state'].serializedGrid.root.data.editors, [])
            } finally {
                database.close()
            }
        }
    } finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
