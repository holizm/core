import { spawnSync } from 'child_process'
import { availableParallelism } from 'os'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'

const files = (await fg('**/*{Test,Tests}.js', {
    ignore: [
        '**/dist/**',
        '**/node_modules/**',
        '**/server/**',
    ],
    onlyFiles: true,
})).sort()

if (files.length) {
    const result = spawnSync(process.execPath, [
        '--import',
        fileURLToPath(new URL('./registerTestModules.js', import.meta.url)),
        '--test',
        `--test-concurrency=${availableParallelism()}`,
        ...files,
    ], {
        env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT')),
        stdio: 'inherit',
    })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
}
