import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import test from 'node:test'
import getSiteStylesVolume from './getSiteStylesVolume.js'
import prepareComposeFile from './prepareComposeFile.js'

test('theme startup does not require an unused process-level stylesheet', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'siteStyleMountTests'))
    try {
        mkdirSync(path.join(directory, 'styles'))
        const volume = getSiteStylesVolume({
            containerHome: '/home/dev',
            process: 'site',
            processPath: directory,
            repo: 'exampleThemes',
        })
        const compose = path.join(directory, 'compose.yaml')
        writeFileSync(compose, `services:\n    site:\n        volumes:\n            ${volume}\n`)
        assert.doesNotThrow(() => prepareComposeFile(compose))
        assert.equal(volume.includes('style.css'), false)
    }
    finally {
        rmSync(directory, {
            force: true,
            recursive: true,
        })
    }
})
