export default (content, hosts) => {
    const mappings = new Map()
    for (const entry of hosts) {
        const host = typeof entry === 'string'
            ?
            entry
            :
            entry.host
        const ip = typeof entry === 'string'
            ?
            '127.0.0.1'
            :
            entry.ip
        if (!host || !ip || /\s|#/.test(host) || /\s|#/.test(ip)) {
            throw new Error('Invalid local DNS mapping')
        }
        if (mappings.has(host) && mappings.get(host) !== ip) {
            throw new Error(`Conflicting local DNS addresses for ${host}`)
        }
        mappings.set(host, ip)
    }
    const remaining = new Map(mappings)
    const lines = content.split('\n').flatMap(line => {
        const commentIndex = line.indexOf('#')
        const body = commentIndex === -1
            ?
            line
            :
            line.slice(0, commentIndex)
        const comment = commentIndex === -1
            ?
            ''
            :
            line.slice(commentIndex)
        const [ip, ...rest] = body.trim().split(/\s+/)
        if (!rest.some(host => mappings.has(host))) return [line]
        const retained = rest.filter(host => {
            if (!mappings.has(host)) return true
            if (mappings.get(host) === ip && remaining.has(host)) {
                remaining.delete(host)
                return true
            }
            return false
        })
        if (retained.length === rest.length) return [line]
        if (!retained.length) return comment ? [comment] : []
        const suffix = comment ? ` ${comment}` : ''
        return [`${ip} ${retained.join(' ')}${suffix}`]
    })
    while (lines.at(-1) === '') lines.pop()
    for (const [host, ip] of remaining) lines.push(`${ip} ${host}`)
    const result = `${lines.join('\n')}\n`
    return result
}
