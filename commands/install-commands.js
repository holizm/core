#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'

console.log('🔧 Registering commands in PATH...')
const commandsDir = '~/core/commands'
const homeDir = os.homedir()
const profileFile = path.join(homeDir, '.bashrc')

const exportLine = `export PATH='${commandsDir}:$PATH'`
const profileContent = fs.readFileSync(profileFile, 'utf-8')
if (!profileContent.includes(commandsDir)) {
    fs.appendFileSync(profileFile, `\n# Added by core install script\n${exportLine}\n`)
    console.log(`✅ Added commands directory to PATH in ${profileFile}`)
} else {
    console.log('✅ Commands directory already in PATH')
}

console.log('✅ Commands registration complete')
