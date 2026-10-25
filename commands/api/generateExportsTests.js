import test from 'node:test'
import assert from 'assert/strict'
import { execFile } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const execute = promisify(execFile)
const generator = fileURLToPath(new URL('./generateExports.js', import.meta.url))

test('generated public exports remain importable after deployment relocation', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'publicExports'))
    const source = path.join(directory, 'source')
    const target = path.join(directory, 'published')
    const root = path.join(source, 'sample/siteApi/node_modules/geo')
    const business = path.join(root, 'business/location')
    await fs.mkdir(business, { recursive: true })
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}')
    await fs.writeFile(path.join(business, 'extendListParameters.js'), 'export const location = true\n')
    await fs.writeFile(path.join(business, 'extendListParametersTests.js'), 'throw new Error()\n')
    try {
        await execute(process.execPath, [generator, 'geo'], {
            env: {
                ...process.env,
                containerHome: source,
                process: 'siteApi',
                repo: 'sample',
            },
            stdio: 'pipe',
        })
        const exports = await fs.readFile(path.join(root, 'exports.js'), 'utf8')
        assert.equal(exports.includes(source), false)
        assert.ok(exports.includes(`'./business/location/extendListParameters.js'`))
        assert.equal(exports.includes('Tests.js'), false)
        await fs.rename(source, target)
        const published = path.join(target, 'sample/siteApi/node_modules/geo/exports.js')
        const output = await execute(process.execPath, [published])
        assert.equal(output.stdout, '')
    }
    finally {
        await fs.rm(directory, {
            force: true,
            recursive: true,
        })
    }
})
