import { lstatSync } from 'fs'
import path from 'path'
import { getContent } from './os.js'
import { runOnTerminalAsync } from './terminal.js'

const sourceExtensions = new Set(['.bash', '.css', '.html', '.java', '.js', '.jsx', '.py', '.sh', '.sql', '.ts', '.tsx'])
const excludedDirectories = new Set(['build', 'coverage', 'dist', 'node_modules', 'vendor'])

export default async repositories => {
    const files = new Set()
    for (const repository of repositories) {
        const output = await runOnTerminalAsync('git ls-files --cached --others --exclude-standard -z', {
            cwd: repository,
            throwOnError: true,
        })
        for (const relative of output.split('\0').filter(Boolean)) {
            const segments = relative.split('/')
            if (segments.some(segment => segment.startsWith('.') || excludedDirectories.has(segment))) continue
            if (/\.(?:min|development|production)(?:\.min)?\.(?:js|css)$/.test(relative)) continue
            const file = path.join(repository, relative)
            try {
                if (segments.some((segment, index) => lstatSync(path.join(repository, ...segments.slice(0, index + 1))).isSymbolicLink())) continue
                if (!lstatSync(file).isFile()) continue
                const extension = path.extname(file)
                if (sourceExtensions.has(extension) || !extension && /^#!.*\b(?:node|bash|sh|python)\b/.test(getContent(file))) files.add(file)
            } catch (e) {
                if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e
            }
        }
    }
    return [...files].sort()
}
