import {
    existsSync,
    mkdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'fs'
import path from 'path'
import { parse } from '@babel/parser'
import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'

const parser = new Parser()
parser.setLanguage(JavaScript)
const cache = new Map()

const getCst = content => {
    const visit = node => {
        const result = {
            children: node.namedChildren.map(visit),
            from: node.startIndex,
            to: node.endIndex,
            type: node.type,
        }
        return result
    }
    const result = visit(parser.parse(content).rootNode)
    result.format = 'treeSitter'
    return result
}

const loadTree = (filePath, content, outputPath, createTree, sourceMtime, isValid) => {
    if (existsSync(outputPath) && statSync(outputPath).mtimeMs >= sourceMtime) {
        try {
            const tree = JSON.parse(readFileSync(outputPath, 'utf8'))
            if (!isValid || isValid(tree)) return tree
        }
        catch (e) {
        }
    }
    const tree = createTree(content, filePath)
    mkdirSync(path.dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, JSON.stringify(tree))
    return tree
}

export const loadJavaScriptSyntaxTrees = (filePath, content) => {
    const sourceMtime = statSync(filePath).mtimeMs
    const cached = cache.get(filePath)
    if (cached?.sourceMtime === sourceMtime) return cached
    const directory = path.join('/tmp', filePath)
    const name = path.basename(filePath)
    const astPath = path.join(directory, `${name}.ast`)
    const cstPath = path.join(directory, `${name}.cst`)
    let ast = null
    try {
        ast = loadTree(filePath, content, astPath, (source, sourcePath) => parse(source, {
            plugins: ['decorators-legacy', 'jsx', 'typescript'],
            sourceFilename: sourcePath,
            sourceType: 'unambiguous',
            tokens: true,
        }), sourceMtime, tree => Boolean(tree.tokens))
    }
    catch (e) {
    }
    const cst = loadTree(filePath, content, cstPath, getCst, sourceMtime, tree => tree.format === 'treeSitter')
    const result = {
        ast,
        astPath,
        cst,
        cstPath,
        sourceMtime,
    }
    cache.set(filePath, result)
    return result
}

export const createJavaScriptSyntaxTrees = async filePath => {
    const content = readFileSync(filePath, 'utf8')
    const trees = loadJavaScriptSyntaxTrees(filePath, content)
    return trees
}
