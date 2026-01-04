import { createDirIfNotExists } from './os.js'

export default params => {
    const {
        home,
        process,
        processType,
        repo,
    } = params
    const tempDirs = [
        [`/tmp/${repo}`, `${home}/${repo}`],
        [`/tmp/${repo}/common`, `${home}/${repo}/common`],
        [`/tmp/${repo}/${process}`, `${home}/${repo}/${process}`],
        [`/tmp/${repo}/${process}/ast`, `${home}/${repo}/${process}/ast`],
        `/var/tmp/${repo}`,
        `/var/tmp/${repo}/${processType}`,
        `/var/tmp/${repo}/${processType}/nodeModules`,
        `/var/tmp/${processType}`,
        `/var/tmp/${processType}/nodeModules`,
        [`${home}/packages`, `${home}/packages`],
        [`${home}/packages/${processType}`, `${home}/packages/${processType}`],
    ]
    for (const tempDir of tempDirs) {
        if (Array.isArray(tempDir)) {
            const [left, right] = tempDir
            createDirIfNotExists(left)
            params.addVolume(left, right)
        }
        else {
            createDirIfNotExists(tempDir)
        }
    }
}
