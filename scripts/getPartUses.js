export default source => {
    const lines = source.split(/\r?\n/)
    const used = new Set()
    let usesIndent = -1

    for (const line of lines) {
        if (!line.trim()) continue
        const indent = line.length - line.trimStart().length
        if (usesIndent >= 0 && indent <= usesIndent) usesIndent = -1
        if (line.trim() === 'uses') {
            usesIndent = indent
            continue
        }
        if (usesIndent >= 0 && indent === usesIndent + 4) used.add(line.trim().split(/\s+/)[0])
    }

    return [...used]
}
