export default (name, {
    containerName,
    pattern,
}) => {
    if (containerName) return name === containerName
    if (!pattern) return true
    return name.toLowerCase().includes(pattern.toLowerCase())
}
