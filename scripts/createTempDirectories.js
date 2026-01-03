import { createDirIfNotExists } from "./os.js"

export default params => {
    const {
        home,
        process,
        repo,
    } = params
    const tempDirs = [
        `/tmp/${repo}`,
        `/tmp/${repo}/${process}`,
    ]
    for (const tempDir of tempDirs) {
        createDirIfNotExists(tempDir)
        const containerPath = tempDir.replace('/tmp', home)
        params.addVolume(tempDir, containerPath)
    }
}
