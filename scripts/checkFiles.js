import { spawn } from 'child_process'
import { statSync } from 'fs'
import { availableParallelism } from 'os'
import path from 'path'
import reportPolicyTimings from './reportPolicyTimings.js'

const target = path.resolve(process.argv[2] || process.cwd())
const policyRunner = path.resolve(import.meta.dirname, '../../policies/run.js')

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

const runFile = file => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [policyRunner, file], {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    })
    const output = []
    const errors = []
    let timings = []
    child.stdout.on('data', chunk => output.push(chunk))
    child.stderr.on('data', chunk => errors.push(chunk))
    child.on('message', message => {
        if (message?.type === 'policyTimings') timings = message.timings
    })
    child.on('error', reject)
    child.on('close', code => {
        const result = {
            code,
            error: Buffer.concat(errors).toString(),
            output: Buffer.concat(output).toString(),
            timings,
        }
        resolve(result)
    })
})

const files = statSync(target).isFile() ? [target] : await findFiles()
const parallelism = Math.min(availableParallelism(), Math.max(files.length, 1))
let next = 0
let failures = 0
const fileTimings = []

await Promise.all(Array.from({ length: parallelism }, async () => {
    while (next < files.length) {
        const index = next++
        const result = await runFile(files[index])
        fileTimings.push(result.timings)
        if (result.output) {
            process.stdout.write(result.output)
        }
        if (result.error) process.stderr.write(result.error)
        if (result.code !== 0) failures++
    }
}))

reportPolicyTimings(fileTimings)
if (failures) process.exitCode = 1
