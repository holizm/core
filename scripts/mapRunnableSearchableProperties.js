import { isFile } from './os.js'

export default params => {
    const {
        commonPath,
        containerHome,
        process,
        repo,
        runnableSearchablePropertiesPath,
    } = params
    const filename = 'runnableSearchableProperties.json'
    if (isFile(runnableSearchablePropertiesPath)) {
        params.addVolume(`${commonPath}/${filename}`, `${containerHome}/${repo}/${process}/${filename}`)
    }
}
