import getApiRepo from './getApiRepo.js'
import isDir from './isDir.js'
import isFile from './isFile.js'

export default params => {
    const {
        containerHome,
        home,
        repo,
    } = params
    for (const dependency of params.dependencies || []) {
        const roots = [
            `${home}/${getApiRepo(repo)}/${dependency}`,
            `${home}/${dependency}`,
        ]
        const root = roots.find(root => isFile(`${root}/part`))
        if (root && isDir(`${root}/testData`)) {
            params.addVolume(`${root}/testData`, `${containerHome}/testData/${dependency}:ro`)
        }
    }
}
