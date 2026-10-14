import { spawnSync } from 'child_process'
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
        '--test',
        ...files,
    ], {
        env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'NODE_TEST_CONTEXT')),
        stdio: 'inherit',
    })
    if (result.error) throw result.error
    process.exitCode = result.status ?? 1
}
