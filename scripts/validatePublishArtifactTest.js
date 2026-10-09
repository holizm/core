import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import validatePublishArtifact from './validatePublishArtifact.js'

test('Publish artifacts exclude runtime settings and private files', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publishArtifact'))
    const artifactPath = path.join(directory, 'panel.zip')
    try {
        fs.mkdirSync(path.join(directory, 'assets'))
        fs.writeFileSync(path.join(directory, 'assets', 'index.js'), 'export default true')
        execFileSync('zip', ['-q', artifactPath, 'assets/index.js'], { cwd: directory })
        assert.doesNotThrow(() => validatePublishArtifact(artifactPath))

        fs.writeFileSync(path.join(directory, 'publicCommon.json'), '{}')
        execFileSync('zip', ['-q', artifactPath, 'publicCommon.json'], { cwd: directory })
        assert.throws(() => validatePublishArtifact(artifactPath), /publicCommon\.json/)

        fs.unlinkSync(artifactPath)
        fs.mkdirSync(path.join(directory, 'nested'))
        fs.writeFileSync(path.join(directory, 'nested', 'settingsOverride.json'), '{}')
        execFileSync('zip', ['-q', artifactPath, 'nested/settingsOverride.json'], { cwd: directory })
        assert.throws(() => validatePublishArtifact(artifactPath), /settingsOverride\.json/)
    }
    finally {
        fs.rmSync(directory, { force: true, recursive: true })
    }
})
