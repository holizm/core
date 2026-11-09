import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import pruneInactiveWebServerConfigs from './pruneInactiveWebServerConfigs.js'

test('removes stopped process routes and keeps active and starting routes', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'webServerConfigTest'))
    const home = path.join(directory, 'home')
    const root = path.join(directory, 'tmp')
    const createProcess = (repository, process, containerName) => {
        const directory = path.join(root, repository, process)
        fs.mkdirSync(path.join(home, repository, '.git'), { recursive: true })
        fs.mkdirSync(path.join(directory, 'webServer', 'conf.d'), { recursive: true })
        fs.mkdirSync(path.join(directory, 'webServer', 'includes'), { recursive: true })
        fs.writeFileSync(path.join(directory, 'compose.yaml'), `container_name: ${containerName}\n`)
        fs.writeFileSync(path.join(directory, 'webServer', 'conf.d', 'holism.local.conf'), '')
        return directory
    }

    try {
        fs.mkdirSync(path.join(root, 'snap-private-tmp'), { recursive: true })
        fs.chmodSync(path.join(root, 'snap-private-tmp'), 0)
        const stopped = createProcess('holism', 'siteApi', 'holismSiteApi')
        const active = createProcess('jzp', 'adminApi', 'jzpAdminApi')
        const starting = createProcess('jzp', 'siteApi', 'jzpSiteApi')

        const removed = pruneInactiveWebServerConfigs({
            activeContainers: ['jzpAdminApi'],
            home,
            keepContainerName: 'jzpSiteApi',
            root,
        })

        assert.equal(removed, 1)
        assert.equal(fs.existsSync(path.join(stopped, 'webServer', 'conf.d')), false)
        assert.equal(fs.existsSync(path.join(active, 'webServer', 'conf.d')), true)
        assert.equal(fs.existsSync(path.join(starting, 'webServer', 'conf.d')), true)
    }
    finally {
        fs.chmodSync(path.join(root, 'snap-private-tmp'), 0o700)
        fs.rmSync(directory, { force: true, recursive: true })
    }
})
