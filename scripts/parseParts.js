export const parseParts = value => [...new Set(
    String(value || '')
        .split(',')
        .map(part => part.trim().replace(/\//g, ''))
        .filter(Boolean)
)]

export const includesPart = (value, part) => {
    const parts = parseParts(value)
    return parts.length === 0 || parts.includes(part)
}
