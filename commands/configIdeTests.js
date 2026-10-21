import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'

test('creates missing keybindings and preserves user settings on repeated setup', () => {
    const home = mkdtempSync(join(tmpdir(), 'setupIde'))
    try {
        for (const directory of ['core/ide', '.config/Code/User', 'bin']) {
            mkdirSync(join(home, directory), { recursive: true })
        }
        writeFileSync(join(home, 'core/ide/settings.json'), readFileSync(new URL('../ide/settings.json', import.meta.url)))
        writeFileSync(join(home, 'core/ide/shortcuts.json'), '[{"key":"ctrl+k","command":"example"}]')
        writeFileSync(join(home, '.config/Code/User/settings.json'), '{"custom":true}')
        writeFileSync(join(home, 'bin/runnables'), '#!/bin/sh\nprintf ""\n', { mode: 0o755 })
        const options = {
            env: { ...process.env, HOME: home, PATH: `${home}/bin:${process.env.PATH}` },
        }
        const command = new URL('./configIde', import.meta.url).pathname
        execFileSync(process.execPath, [command], options)
        execFileSync(process.execPath, [command], options)
        const bindings = JSON.parse(readFileSync(join(home, '.config/Code/User/keybindings.json')))
        assert.equal(bindings.length, 1)
        assert.equal(JSON.parse(readFileSync(join(home, '.config/Code/User/settings.json'))).custom, true)
        const settings = JSON.parse(readFileSync(join(home, '.config/Code/User/settings.json')))
        assert.equal(settings['workbench.secondarySideBar.defaultVisibility'], 'hidden')
        assert.equal(settings['workbench.startupEditor'], 'none')
        assert.equal(settings['security.workspace.trust.enabled'], false)
    } finally {
        rmSync(home, { force: true, recursive: true })
    }
})
