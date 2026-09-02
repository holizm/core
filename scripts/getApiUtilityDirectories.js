export default ({
    containerHome,
    process,
}) => {
    if (!process.startsWith('admin')) {
        return []
    }
    const directories = [
        ['/tmp/generation', `${containerHome}/generation`],
        ['/tmp/migration', `${containerHome}/migration`],
        ['/tmp/query', `${containerHome}/query`],
        ['/tmp/toMongo', `${containerHome}/toMongo`],
    ]
    return directories
}
