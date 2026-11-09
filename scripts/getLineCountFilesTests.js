import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import getLineCountFiles from './getLineCountFiles.js'

test('line counts include authored source while excluding data, dependencies, output, and composition links', async context => {
    const repository = mkdtempSync(path.join(tmpdir(), 'lineCountRepo'))
    context.after(() => rmSync(repository, {
        force: true,
        recursive: true,
    }))
    execFileSync('git', ['init', '--quiet', repository])
    const files = {
        '.gitignore': 'ignored.js\n',
        'README.md': 'Documentation\n',
        'commands/start': '#!/usr/bin/env bash\necho started\n',
        'data/records.json': '{ "title": "Data" }\n',
        'dist/app.js': 'export default true\n',
        'ignored.js': 'export default true\n',
        'lock.json': '{}\n',
        'node_modules/example/index.js': 'export default true\n',
        'source/card.jsx': 'export default () => <div />\n',
        'source/cardTests.js': 'export default true\n',
        'statics/react.development.js': 'export default true\n',
        'styles/main.css': 'body { color: red }\n',
    }
    for (const [name, content] of Object.entries(files)) {
        const file = path.join(repository, name)
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, content)
    }
    symlinkSync('source/card.jsx', path.join(repository, 'linked.jsx'))
    symlinkSync('source', path.join(repository, 'composed'))
    execFileSync('git', ['add', '.'], { cwd: repository })
    writeFileSync(path.join(repository, 'source/new.js'), 'export default true\n')
    rmSync(path.join(repository, 'source/cardTests.js'))
    const result = await getLineCountFiles([repository, repository])
    assert.deepEqual(result, [
        'commands/start',
        'source/card.jsx',
        'source/new.js',
        'styles/main.css',
    ].map(name => path.join(repository, name)))
})
