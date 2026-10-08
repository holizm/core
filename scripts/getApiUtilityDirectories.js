import getProcessRole from './getProcessRole.js'

export default ({
    containerHome,
    isControl,
    process,
    repo,
}) => {
    if (getProcessRole(process, isControl) !== 'admin') {
        return []
    }
    const utilityRoot = `/tmp/${repo}/${process}Utilities`
    const directories = [
        [`${utilityRoot}/generation`, `${containerHome}/generation`],
        [`${utilityRoot}/migration`, `${containerHome}/migration`],
        [`${utilityRoot}/query`, `${containerHome}/query`],
        [`${utilityRoot}/toMongo`, `${containerHome}/toMongo`],
    ]
    return directories
}
