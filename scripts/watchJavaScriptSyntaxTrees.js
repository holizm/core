import path from 'node:path'
import chokidar from 'chokidar'
import { createJavaScriptSyntaxTrees } from './createJavaScriptSyntaxTrees.js'

const root = '/home/dev'
const ignoredSegments = new Set(['.git', 'node_modules'])
const pending = new Map()

const isJavaScriptFile = filePath => ['.js', '.jsx'].includes(path.extname(filePath))

const isIgnored = filePath => filePath.split(path.sep).some(segment => ignoredSegments.has(segment))

const update = filePath => {
    if (isIgnored(filePath) || !isJavaScriptFile(filePath)) {
        return
    }
    clearTimeout(pending.get(filePath))
    pending.set(filePath, setTimeout(async () => {
        pending.delete(filePath)
        try {
            await createJavaScriptSyntaxTrees(filePath)
        } catch (e) {
            console.error(e)
        }
    }, 100))
}

chokidar
    .watch(root, {
        ignored: filePath => isIgnored(filePath),
        ignoreInitial: false,
        persistent: true,
    })
    .on('add', update)
    .on('change', update)
