import { rmSync } from 'fs'
import getDependencies from "./getDependencies.js"
import { createDirIfNotExists } from './os.js'

export default params => {
    const {
        extraDirectories,
        home,
        process,
        processType,
        repo,
    } = params
    // rmSync(`/tmp/${repo}/${process}`, { recursive: true })
    const hasSourceDirectory = ['panel', 'site'].includes(processType)
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
        [`/tmp/spl`, `${home}/spl`],
        [`${home}/packages`, `${home}/packages`],
        [`${home}/packages/${processType}`, `${home}/packages/${processType}`],
    ]
    if (extraDirectories) {
        tempDirs.push(...extraDirectories)
    }
    if (hasSourceDirectory) {
        tempDirs.push([`/tmp/${repo}/${process}/src`, `${home}/${repo}/${process}/src`])
    }
    const dependencies = getDependencies(params)
    for (const dependency of dependencies) {
        tempDirs.push([`/tmp/${repo}/${process}/${hasSourceDirectory ? 'src/' : ''}${dependency}`, `${home}/${repo}/${process}/${hasSourceDirectory ? 'src/' : ''}${dependency}`])
    }
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
