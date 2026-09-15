import { parse } from '@babel/parser'

const analyzeJavaScriptImports = content => {
    let tree

    try {
        tree = parse(content, {
            plugins: ['jsx', 'typescript'],
            sourceType: 'unambiguous',
        })
    } catch (e) {
        return []
    }

    return tree.program.body
        .filter(node => node.type === 'ImportDeclaration')
        .map(node => node.source.value)
}

export default analyzeJavaScriptImports
