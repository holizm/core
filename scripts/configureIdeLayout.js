import { DatabaseSync } from 'node:sqlite'
import fg from 'fast-glob'
import removeIdeWelcomeEditors from './removeIdeWelcomeEditors.js'

export default async userDirectory => {
    const paths = await fg([
        'workspaceStorage/*/state.vscdb',
        'profiles/*/workspaceStorage/*/state.vscdb',
    ], {
        absolute: true,
        cwd: userDirectory,
        onlyFiles: true,
    })
    for (const path of paths) {
        const database = new DatabaseSync(path)
        try {
            database.exec('BEGIN IMMEDIATE')
            database.prepare('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)')
                .run('workbench.auxiliaryBar.hidden', 'true')
            const editorKey = 'memento/workbench.parts.editor'
            const storedEditors = database.prepare('SELECT value FROM ItemTable WHERE key = ?').get(editorKey)
            if (storedEditors) {
                const state = removeIdeWelcomeEditors(JSON.parse(storedEditors.value))
                database.prepare('UPDATE ItemTable SET value = ? WHERE key = ?').run(JSON.stringify(state), editorKey)
            }
            database.exec('COMMIT')
        } finally {
            database.close()
        }
    }
}
