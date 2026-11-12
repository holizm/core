import assert from 'assert/strict'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { test } from 'node:test'
import {
    deleteFile,
    getContent,
    writeFile,
} from '../scripts/os.js'
import { runOnTerminalAsync } from '../scripts/terminal.js'

test('configBrowser preserves settings, is repeatable, and protects active or invalid state', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'configBrowser'))
    const commandPath = new URL('./configBrowser', import.meta.url).pathname
    const quote = value => `'${value.replaceAll(`'`, `'\\''`)}'`
    const command = `${quote(process.execPath)} ${quote(commandPath)}`
    const options = {
        env: {
            ...process.env,
            CHROME_CONFIG_HOME: '',
            CHROME_USER_DATA_DIR: '',
            HOME: directory,
            XDG_CONFIG_HOME: `${directory}/configuration`,
        },
        throwOnError: true,
    }
    const browserDirectory = `${directory}/configuration/google-chrome`
    const settingsPath = `${browserDirectory}/Local State`
    try {
        await runOnTerminalAsync(command, options)
        const initialSettings = JSON.parse(getContent(settingsPath))
        assert.equal(initialSettings.devtools.remote_debugging['user-enabled'], true)
        const settings = {
            custom: [false, 0, 'Retained'],
            devtools: {
                custom: 'Retained',
                remote_debugging: {
                    allowed: false,
                    'user-enabled': false,
                },
            },
        }
        writeFile(settingsPath, JSON.stringify(settings))
        await runOnTerminalAsync(command, options)
        settings.devtools.remote_debugging['user-enabled'] = true
        assert.deepEqual(JSON.parse(getContent(settingsPath)), settings)
        const configured = getContent(settingsPath)
        await runOnTerminalAsync(command, options)
        assert.equal(getContent(settingsPath), configured)
        writeFile(`${browserDirectory}/SingletonSocket`, '')
        await assert.rejects(runOnTerminalAsync(command, options), /Close Chrome completely/)
        assert.equal(getContent(settingsPath), configured)
        deleteFile(`${browserDirectory}/SingletonSocket`)
        writeFile(settingsPath, '{invalid')
        await assert.rejects(runOnTerminalAsync(command, options))
        assert.equal(getContent(settingsPath), '{invalid')
        for (const variable of ['CHROME_CONFIG_HOME', 'CHROME_USER_DATA_DIR']) {
            const target = `${directory}/${variable === 'CHROME_CONFIG_HOME' ? 'config' : 'data'}`
            options.env[variable] = target
            await runOnTerminalAsync(command, options)
            const path = `${target}${variable === 'CHROME_CONFIG_HOME' ? '/google-chrome' : ''}/Local State`
            assert.equal(JSON.parse(getContent(path)).devtools.remote_debugging['user-enabled'], true)
        }
    } finally {
        deleteFile(directory)
    }
})
