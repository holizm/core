import { parse } from '@babel/parser'

export default source => {
    const imports = new Set()
    const tree = parse(source, {
        plugins: ['jsx', 'typescript'],
        sourceType: 'unambiguous',
    })
    const visit = node => {
        if (!node || typeof node !== 'object') return
        if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type)) {
            if (node.source) imports.add(node.source.value)
        }
        if (node.type === 'CallExpression' && node.callee.type === 'Import' && node.arguments[0]?.type === 'StringLiteral') {
            imports.add(node.arguments[0].value)
        }
        if (node.type === 'ImportExpression' && node.source?.type === 'StringLiteral') imports.add(node.source.value)
        for (const [key, value] of Object.entries(node)) {
            if (['loc', 'extra', 'comments', 'tokens'].includes(key)) continue
            if (Array.isArray(value)) value.forEach(visit)
            else if (value && typeof value === 'object') visit(value)
        }
    }
    visit(tree.program)
    return imports
}
