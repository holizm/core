import assert from 'assert/strict'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getPublishedPackageInstallCommand from './getPublishedPackageInstallCommand.js'

const runInstallation = installation => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publishedPackages'))
    const processPath = path.join(root, 'deployment/api')
    const archivePath = path.join(root, 'archive')
    const sourcePath = path.join(root, 'source')
    const packagePath = path.join(sourcePath, 'node_modules/tenants')
    fs.mkdirSync(packagePath, { recursive: true })
    fs.mkdirSync(processPath, { recursive: true })
    fs.mkdirSync(archivePath)
    fs.writeFileSync(path.join(packagePath, 'exports.js'), 'export * from \'/home/dev/example/api/node_modules/tenants/tenant.js\'\n')
    fs.writeFileSync(path.join(packagePath, 'tenant.js'), 'export default true\n')
    execFileSync('zip', ['-qr', path.join(archivePath, 'api.zip'), 'node_modules'], { cwd: sourcePath })
    const command = getPublishedPackageInstallCommand({
        isApi: true,
        process: 'api',
        repo: 'example',
    }, archivePath, processPath).replace('/holism/server/commands/installPackages', () => installation)
    let status = 0
    try {
        execFileSync('bash', ['-c', command], { stdio: 'pipe' })
    }
    catch (e) {
        status = e.status
    }
    try {
        assert.equal(fs.existsSync(path.join(processPath, 'node_modules/tenants/tenant.js')), true)
        const exports = fs.readFileSync(path.join(processPath, 'node_modules/tenants/exports.js'), 'utf8')
        assert.ok(exports.includes(path.join(root, 'deployment/api/node_modules/tenants/tenant.js')))
        assert.equal(exports.includes('/home/dev/example/'), false)
    }
    finally {
        fs.rmSync(root, {
            force: true,
            recursive: true,
        })
    }
    return status
}

test('API package installation restores pruned platform modules before returning successfully', () => {
    assert.equal(runInstallation('rm -rf node_modules/tenants; true'), 0)
})

test('failed installation still restores handlers and preserves the failure status', () => {
    assert.equal(runInstallation('rm -rf node_modules/tenants; exit 42'), 42)
})

test('interrupted installation restores handlers without requiring another SSH request', () => {
    assert.equal(runInstallation('rm -rf node_modules/tenants; kill -HUP $$'), 129)
})

test('panel package installation remains unchanged', () => {
    const command = getPublishedPackageInstallCommand({ isPanel: true }, '/tmp/build', '$HOME/example/panel')
    assert.equal(command, 'cd "$HOME/example/panel" && /holism/server/commands/installPackages')
})

test('built sites install runtime dependencies without resolving development packages', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publishedSitePackages'))
    const packagePath = path.join(root, 'package.json')
    const metadata = {
        dependencies: { express: '1.0.0' },
        devDependencies: { typescript: '999.0.0' },
        private: true,
    }
    try {
        fs.writeFileSync(packagePath, JSON.stringify(metadata))
        const command = getPublishedPackageInstallCommand({ isSite: true }, '/tmp/build', root)
            .replace('/holism/server/commands/installPackages', 'true')
        execFileSync('bash', ['-c', command])
        const result = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        assert.deepEqual(result.dependencies, metadata.dependencies)
        assert.equal(result.private, true)
        assert.equal(Object.hasOwn(result, 'devDependencies'), false)
    }
    finally {
        fs.rmSync(root, {
            force: true,
            recursive: true,
        })
    }
})
