import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    chmodSync,
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import {
    availableParallelism,
    tmpdir,
} from 'os'
import path from 'path'
import test from 'node:test'

test('loc passes an explicit source list to cloc and removes it on success or failure', context => {
    const directory = mkdtempSync(path.join(tmpdir(), 'lineCount command '))
    context.after(() => rmSync(directory, {
        force: true,
        recursive: true,
    }))
    const hook = path.join(directory, 'hook.mjs')
    const fixture = path.join(directory, 'fixture.mjs')
    const executable = path.join(directory, 'cloc')
    const log = path.join(directory, 'log')
    writeFileSync(fixture, "export default async () => ['/example/source.js']\n")
    writeFileSync(hook, `import { registerHooks } from 'module'
registerHooks({ resolve: (specifier, context, nextResolve) => nextResolve(
    specifier.endsWith('/getLineCountFiles.js') ? new URL('./fixture.mjs', import.meta.url).href : specifier,
    context,
) })
`)
    writeFileSync(executable, `#!/usr/bin/env bash
printf '%s\\n' "$@" > "$lineCountLog"
for argument in "$@"; do
    if [[ $argument == --list-file=* ]]; then
        cat "$(printf '%s' "$argument" | cut -d= -f2-)" >> "$lineCountLog"
    fi
done
exit "$lineCountStatus"
`)
    chmodSync(executable, 0o755)
    for (const status of ['0', '7']) {
        const run = () => execFileSync(process.execPath, ['--import', hook, path.join(import.meta.dirname, 'loc')], {
            env: {
                ...process.env,
                PATH: `${directory}:${process.env.PATH}`,
                TMPDIR: directory,
                lineCountLog: log,
                lineCountStatus: status,
            },
            stdio: 'pipe',
        })
        if (status === '0') assert.doesNotThrow(run)
        else assert.throws(run)
        const lines = readFileSync(log, 'utf8').trim().split('\n')
        assert.equal(lines[0], `--processes=${availableParallelism()}`)
        assert.equal(lines[2], '/example/source.js')
        assert.equal(existsSync(lines[1].slice('--list-file='.length)), false)
    }
})
