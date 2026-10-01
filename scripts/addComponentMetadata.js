import resolveComponentMetadata from './resolveComponentMetadata.js'

const nativeTypeElements = new Set(['a', 'area', 'button', 'embed', 'input', 'link', 'object', 'ol', 'script', 'source', 'style'])

export default ({ types: t }, options) => {
    const metadata = resolveComponentMetadata(options.id)
    const platformComponents = new Set()
    const addAttributes = (node, allowComponent = true) => {
        if (t.isJSXFragment(node)) {
            node.children.forEach(child => {
                if (t.isJSXExpressionContainer(child)) addAttributes(child.expression, false)
                else addAttributes(child, false)
            })
            return
        }
        if (t.isConditionalExpression(node)) {
            addAttributes(node.consequent, allowComponent)
            addAttributes(node.alternate, allowComponent)
            return
        }
        if (t.isLogicalExpression(node)) {
            addAttributes(node.right, allowComponent)
            return
        }
        if (!t.isJSXElement(node)) return
        const opening = node.openingElement
        if (!t.isJSXIdentifier(opening.name)) return
        if (!/^[a-z]/.test(opening.name.name) && (!allowComponent || !platformComponents.has(opening.name.name))) return
        for (const [name, value] of Object.entries(metadata)) {
            const attributeName = name === 'type' && nativeTypeElements.has(opening.name.name)
                ?
                'data-type'
                :
                name
            if (!value || opening.attributes.some(attribute => attribute.name?.name === attributeName)) continue
            const spreadIndex = opening.attributes.findIndex(attribute => t.isJSXSpreadAttribute(attribute))
            const attribute = t.jsxAttribute(t.jsxIdentifier(attributeName), t.stringLiteral(value))
            if (spreadIndex === -1) opening.attributes.push(attribute)
            else opening.attributes.splice(spreadIndex, 0, attribute)
        }
    }
    const visitComponent = path => {
        if (path.isCallExpression() && path.get('callee').isIdentifier({ name: 'component$' })) {
            visitComponent(path.get('arguments.0'))
            return
        }
        if (path.isIdentifier()) {
            const binding = path.scope.getBinding(path.node.name)
            if (binding?.path?.isVariableDeclarator()) visitComponent(binding.path.get('init'))
            return
        }
        if (path.isArrowFunctionExpression() || path.isFunctionExpression()) {
            if (!path.get('body').isBlockStatement()) {
                addAttributes(path.node.body)
                return
            }
            path.traverse({
                ReturnStatement(returnPath) {
                    if (returnPath.getFunctionParent() === path) addAttributes(returnPath.node.argument)
                },
            })
            return
        }
        addAttributes(path.node)
    }
    const visitor = {
        ImportDeclaration(path) {
            const source = path.node.source.value
            if (source !== 'core' && !source.startsWith('.')) return
            path.node.specifiers.forEach(specifier => platformComponents.add(specifier.local.name))
        },
        ExportDefaultDeclaration(path) {
            if (metadata) visitComponent(path.get('declaration'))
        },
    }
    const plugin = { visitor }
    return plugin
}
