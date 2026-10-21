export default state => {
    const visit = node => {
        if (node.type === 'branch') {
            node.data.forEach(visit)
            return
        }
        const group = node.data
        const indices = new Map()
        const editors = group.editors.filter((editor, index) => {
            if (editor.id === 'workbench.editors.gettingStartedInput') return false
            indices.set(index, indices.size)
            return true
        })
        group.editors = editors
        group.mru = group.mru.filter(index => indices.has(index)).map(index => indices.get(index))
        if (group.preview !== undefined) group.preview = indices.get(group.preview)
        if (group.sticky !== undefined) {
            group.sticky = [...indices.keys()].filter(index => index <= group.sticky).length - 1
        }
    }
    const editorState = state['editorpart.state']
    if (editorState?.serializedGrid?.root) visit(editorState.serializedGrid.root)
    return state
}
