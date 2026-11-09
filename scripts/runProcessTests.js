import { spawnSync } from 'child_process'
import { availableParallelism } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'

const discovered = new Set(await fg('**/*{Test,Tests}.js', {
    ignore: [
        '**/dist/**',
        '**/node_modules/**',
        '**/server/**',
        '**/testing/**',
    ],
    onlyFiles: true,
}))
const command = fileURLToPath(import.meta.url)
const files = [...discovered].filter(file => path.resolve(file) !== command
    && !discovered.has(file.replace(/\.js$/, 'Tests.js'))).sort()

if (files.length) {
    const result = spawnSync(process.execPath, [
        '--experimental-test-module-mocks',
        '--import',
        fileURLToPath(new URL('./registerTestModules.js', import.meta.url)),
        '--test',
        `--test-concurrency=${availableParallelism()}`,
        ...(
            process.env.testTimeoutMilliseconds
                ? [
                    `--test-timeout=${process.env.testTimeoutMilliseconds}`,
                    '--test-force-exit',
                ]
                : []
        ),
        ...files,
    ], {
        env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT')),
        stdio: 'inherit',
    })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
}
