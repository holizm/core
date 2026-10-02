import { spawn } from 'child_process'
import { statSync } from 'fs'
import { availableParallelism } from 'os'
import path from 'path'
import reportPolicyTimings from './reportPolicyTimings.js'

const target = path.resolve(process.argv[2] || process.cwd())
const workerPath = path.resolve(import.meta.dirname, 'checkPolicyWorker.js')

const findFiles = () => new Promise((resolve, reject) => {
    const finder = spawn('find', ['-H', target, '-mindepth', '1', '-type', 'f', '-not', '-name', '.git', '-not', '-path', '*/.git/*', '-print0'])
    const chunks = []
    finder.stdout.on('data', chunk => chunks.push(chunk))
    finder.stderr.on('data', chunk => process.stderr.write(chunk))
    finder.on('error', reject)
    finder.on('close', code => {
        if (code !== 0) return reject(new Error(`find exited with ${code}`))
        const files = Buffer.concat(chunks).toString().split('\0').filter(Boolean).sort()
        resolve(files)
    })
})

const runFile = (child, file) => new Promise((resolve, reject) => {
    let timings = []
    const onMessage = message => {
        if (message?.type === 'policyTimings') timings = message.timings
        if (message?.type !== 'done') return
        child.off('message', onMessage)
        child.off('exit', onExit)
        const result = {
            code: message.code,
            error: message.error,
            output: message.output,
            timings,
        }
        resolve(result)
    }
    const onExit = code => reject(new Error(`Policy worker exited with ${code} while checking ${file}`))
    child.on('message', onMessage)
    child.once('exit', onExit)
    child.send({ file })
})

const files = statSync(target).isFile() ? [target] : await findFiles()
const parallelism = Math.min(availableParallelism(), Math.max(files.length, 1))
let next = 0
let failures = 0
const fileTimings = []

await Promise.all(Array.from({ length: parallelism }, async () => {
    const child = spawn(process.execPath, [workerPath], {
        stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
    })
    while (next < files.length) {
        const index = next++
        const result = await runFile(child, files[index])
        fileTimings.push(result.timings)
        if (result.output) {
            process.stdout.write(result.output)
        }
        if (result.error) process.stderr.write(result.error)
        if (result.code !== 0) failures++
    }
    child.send({ type: 'stop' })
}))

reportPolicyTimings(fileTimings)
if (failures) process.exitCode = 1
