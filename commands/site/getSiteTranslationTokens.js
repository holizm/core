import { parse } from '@babel/parser'

export default source => {
    const tokens = new Set()
    const tree = parse(source, {
        plugins: ['jsx', 'typescript'],
        sourceType: 'unambiguous',
    })
    const visit = node => {
        if (!node || typeof node !== 'object') return
        if (node.type === 'StringLiteral') tokens.add(node.value)
        if (node.type === 'TemplateLiteral' && !node.expressions.length) tokens.add(node.quasis[0].value.cooked)
        if (node.type === 'VariableDeclarator' && node.id.type === 'ObjectPattern' && /translations/i.test(source.slice(node.init?.start, node.init?.end))) {
            for (const property of node.id.properties) {
                if (property.type === 'ObjectProperty') tokens.add(property.key.name || property.key.value)
            }
        }
        if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type) && !node.computed) {
            const expression = source.slice(node.object.start, node.object.end)
            if (/translations/i.test(expression)) tokens.add(node.property.name)
        }
        for (const [key, value] of Object.entries(node)) {
            if (['loc', 'extra', 'comments', 'tokens'].includes(key)) continue
            if (Array.isArray(value)) value.forEach(visit)
            else if (value && typeof value === 'object') visit(value)
        }
    }
    visit(tree.program)
    return tokens
}
