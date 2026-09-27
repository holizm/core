#!/usr/bin/env node

import {
    appendFileSync,
    readFileSync,
} from 'fs'

const args = process.argv.slice(2)
const containers = JSON.parse(readFileSync(process.env.dockerContainersPath, 'utf8'))
appendFileSync(process.env.dockerCallsPath, `${JSON.stringify(args)}\n`)

if (args[0] === 'ps') {
    console.log(containers.join('\n'))
}
else if (args[0] === 'inspect' && containers.includes(args[1])) {
    console.log(JSON.stringify({ Name: `/${args[1]}` }))
}
else if (args[0] !== 'rm' && args[0] !== 'system') {
    process.exitCode = 1
}
