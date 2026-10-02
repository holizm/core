import path from 'path'
import { existsSync } from 'fs'

const policyRunner = path.resolve(import.meta.dirname, '../../policies/run.js')
let runNumber = 0
let output = ''
let error = ''

process.stdout.write = chunk => {
    output += chunk.toString()
    return true
}

process.stderr.write = chunk => {
    error += chunk.toString()
    return true
}

process.on('message', async message => {
    if (message.type === 'stop') {
        process.disconnect()
        return
    }
    output = ''
    error = ''
    process.argv[2] = message.file
    if (!existsSync(message.file) || path.basename(message.file) === 'AGENTS.md' || path.basename(message.file) === 'report' || message.file.includes('/policies/')) {
        process.send({
            code: 0,
            error,
            output,
            type: 'done',
        })
        return
    }
    try {
        await import(`${policyRunner}?run=${runNumber++}`)
        process.send({
            code: 0,
            error,
            output,
            type: 'done',
        })
    }
    catch (e) {
        process.send({
            code: 1,
            error: `${error}${e.stack || e}\n`,
            output,
            type: 'done',
        })
    }
})
