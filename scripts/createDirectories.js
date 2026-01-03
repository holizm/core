import { createDirIfNotExists } from "./os.js"

export default params => {
    const {
        home,
        process,
        processType,
        repo,
    } = params
    const tempDirs = [
        `/tmp/${repo}`,
        `/tmp/${repo}/${process}`,
        `${home}/packages`,
        `${home}/packages/${processType}`,
    ]
    for (const tempDir of tempDirs) {
        createDirIfNotExists(tempDir)
        const containerPath = tempDir.replace('/tmp', home)
        params.addVolume(tempDir, containerPath)
    }
}
