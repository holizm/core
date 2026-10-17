import { parse } from '@babel/parser'

export default source => {
    const tree = parse(source, {
        plugins: ['jsx', 'typescript'],
        sourceType: 'module',
    })
    let defaultName
    let hasDefault = false
    const names = []
    for (const statement of tree.program.body) {
        if (statement.type === 'ExportDefaultDeclaration') {
            defaultName = statement.declaration.name || statement.declaration.id?.name
            hasDefault = true
        }
        if (statement.type !== 'ExportNamedDeclaration' || statement.exportKind === 'type') continue
        const declaration = statement.declaration
        if (declaration?.type === 'VariableDeclaration') {
            for (const item of declaration.declarations) if (item.id.name) names.push(item.id.name)
        }
        else if (declaration?.id?.name && ['ClassDeclaration', 'FunctionDeclaration'].includes(declaration.type)) {
            names.push(declaration.id.name)
        }
        for (const specifier of statement.specifiers) {
            const name = specifier.exported.name
            if (name === 'default') hasDefault = true
            else if (name) names.push(name)
        }
    }
    const exports = {
        defaultName,
        hasDefault,
        names,
    }
    return exports
}
