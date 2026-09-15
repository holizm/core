import {
    mkdir,
    readFile,
    writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { parse } from '@babel/parser'
import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'

const getCst = content => {
    const parser = new Parser()
    parser.setLanguage(JavaScript)
    const tree = parser.parse(content)
    const visit = node => ({
        children: node.namedChildren.map(visit),
        from: node.startIndex,
        to: node.endIndex,
        type: node.type,
    })
    return visit(tree.rootNode)
}

export const createJavaScriptSyntaxTrees = async filePath => {
    const content = await readFile(filePath, 'utf8')
    const ast = parse(content, {
        sourceFilename: filePath,
        sourceType: 'unambiguous',
        plugins: ['jsx', 'typescript'],
    })
    const directory = path.join('/tmp', filePath)
    await mkdir(directory, { recursive: true })
    const fileName = path.basename(filePath)
    await writeFile(path.join(directory, `${fileName}.ast`), JSON.stringify(ast))
    await writeFile(path.join(directory, `${fileName}.cst`), JSON.stringify(getCst(content)))
}
