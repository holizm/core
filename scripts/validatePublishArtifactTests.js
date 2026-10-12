import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import validatePublishArtifact from './validatePublishArtifact.js'

test('validatePublishArtifact accepts public output and rejects excluded files', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publishArtifact'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    fs.writeFileSync(path.join(root, 'index.html'), '<html></html>')
    fs.writeFileSync(path.join(root, 'secrets.json'), '{}')
    const publicArchive = path.join(root, 'public.zip')
    const privateArchive = path.join(root, 'private.zip')
    execFileSync('zip', ['-q', publicArchive, 'index.html'], { cwd: root })
    execFileSync('zip', ['-q', privateArchive, 'secrets.json'], { cwd: root })
    assert.doesNotThrow(() => validatePublishArtifact(publicArchive))
    assert.throws(() => validatePublishArtifact(privateArchive), /secrets\.json/)
})
