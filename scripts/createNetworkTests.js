import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import createNetwork from './createNetwork.js'

test('createNetwork creates a missing project network once', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'createNetwork'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const docker = path.join(directory, 'docker')
    const calls = path.join(directory, 'calls')
    fs.writeFileSync(docker, `#!/bin/sh
case "$1 $2" in
    'network ls') if [ -f '${calls}' ]; then printf 'bridge\\nshopNetwork'; else printf 'bridge'; fi ;;
    'network create') printf '%s' "$*" > '${calls}' ;;
    'network inspect') printf 'currentNetwork' ;;
    'ps -aq') printf 'container' ;;
    'inspect container') printf '%s' '[{"Id":"container","NetworkSettings":{"Networks":{"shopNetwork":{"NetworkID":"oldNetwork","Aliases":["cacheServer"]}}}}]' ;;
    'network disconnect') printf '%s\\n' "$*" >> '${directory}/repairs' ;;
    'network connect') printf '%s\\n' "$*" >> '${directory}/repairs' ;;
esac
`, { mode: 0o700 })
    const previousPath = process.env.PATH
    const previousLog = console.log
    process.env.PATH = `${directory}:${previousPath}`
    console.log = () => {}
    try {
        createNetwork({ networkRepo: 'shop' })
        assert.equal(fs.readFileSync(calls, 'utf8'), 'network create --driver bridge shopNetwork')
        assert.equal(fs.readFileSync(path.join(directory, 'repairs'), 'utf8'),
            'network disconnect --force shopNetwork container\nnetwork connect --alias cacheServer shopNetwork container\n')
        fs.writeFileSync(calls, 'alreadyCreated')
        createNetwork({ networkRepo: 'shop' })
        assert.equal(fs.readFileSync(calls, 'utf8'), 'alreadyCreated')
    }
    finally {
        process.env.PATH = previousPath
        console.log = previousLog
    }
})
