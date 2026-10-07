import getProcessRole from './getProcessRole.js'

export default ({
    containerHome,
    isControl,
    process,
}) => {
    if (getProcessRole(process, isControl) !== 'admin') {
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
