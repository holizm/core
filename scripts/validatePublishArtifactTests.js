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

test('validatePublishArtifact allows generated docs localization pages only for docs content', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docsArtifact'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    fs.mkdirSync(path.join(root, 'content', 'localization'), { recursive: true })
    fs.writeFileSync(path.join(root, 'content', 'localization', 'placement.md'), '# Placement')
    const artifactPath = path.join(root, 'docs.zip')
    execFileSync('zip', ['-qr', artifactPath, 'content'], { cwd: root })
    assert.doesNotThrow(() => validatePublishArtifact(artifactPath, 'docs'))
    assert.throws(() => validatePublishArtifact(artifactPath, 'other'), /localization/)
})

test('validatePublishArtifact rejects source tests', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testArtifact'))
    t.after(() => fs.rmSync(root, { force: true, recursive: true }))
    fs.writeFileSync(path.join(root, 'forestRowTests.js'), '')
    const artifactPath = path.join(root, 'tests.zip')
    execFileSync('zip', ['-q', artifactPath, 'forestRowTests.js'], { cwd: root })
    assert.throws(() => validatePublishArtifact(artifactPath), /forestRowTests\.js/)
})

test('publication rejects local runtime settings at root and nested paths', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtimeSettingsArtifact'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    fs.mkdirSync(path.join(root, 'nested'))
    const names = ['.env', '.env.production', 'iamSettings.json', 'privateSettings.json', 'privateCommon.json', 'connectionStrings.json', 'settingsOverride.json']
    for (const name of names) {
        for (const prefix of ['', 'nested/']) {
            const entry = `${prefix}${name}`
            fs.writeFileSync(path.join(root, entry), 'localSettings')
            const archive = path.join(root, 'runtime.zip')
            execFileSync('zip', ['-q', archive, entry], { cwd: root })
            assert.throws(() => validatePublishArtifact(archive), e => e.message.includes(name))
            fs.unlinkSync(archive)
        }
    }
})
