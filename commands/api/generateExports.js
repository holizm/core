#!/usr/bin/env node

import util from 'util'
import { exec } from 'child_process'
import { join } from 'path'
import { writeFileSync } from 'fs'

const promisifiedExec = util.promisify(exec)
const [, , ...directories] = process.argv

const getFiles = async directory => {
    try {
        const root = `/npm/node_modules/${directory.split('node_modules')[1].split('/')[1]}`
        const command = `find ${root} -mindepth 2 -type f -name '*.js'`
        const { stdout, stderr } = await promisifiedExec(command)
        if (stderr) {
            console.log('stderr:', stderr, command)
            return []
        }
        return stdout
            .split('\n')
            .filter(file => file)
            .map(file => file.trim())
    } catch (err) {
        console.error(err)
        return ''
    }
}

for (let i = 0; i < directories.length; i++) {
    const directory = directories[i];
    const root = `/npm/node_modules/${directory.split('node_modules')[1].split('/')[1]}`
    const exportsFilePath = join(root, 'Exports.js')
    const files = await getFiles(directory)
    const exports = files.map(i => `export * from '${i}'`).join('\n')
    writeFileSync(exportsFilePath, exports)
}
