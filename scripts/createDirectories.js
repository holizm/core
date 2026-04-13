import getDependencies from './getDependencies.js'
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
    const hasRunnableDirectory = ['panel'].includes(processType)
    const isApi = processType === 'api'
    const tempDirs = [
        [`/tmp/${repo}`, `${home}/${repo}`],
        [`/tmp/${repo}/common`, `${home}/${repo}/common`],
        [`/tmp/${repo}/${process}`, `${home}/${repo}/${process}`],
        [`/tmp/${repo}/${process}/ast`, `${home}/${repo}/${process}/ast`],
        [`/tmp/${repo}/${process}/node_modules`, `${home}/${repo}/${process}/node_modules`],
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
        tempDirs.push([
            `/tmp/${repo}/${process}/src`,
            `${home}/${repo}/${process}/src`
        ])
    }
    if (hasRunnableDirectory) {
        tempDirs.push([
            `/tmp/${repo}/${process}/runnable`,
            `${home}/${repo}/${process}/src/runnable`
        ])
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
    const dependencies = getDependencies(params)
    for (const dependency of dependencies) {
        tempDirs.push([
            `/tmp/${repo}/${process}/${hasSourceDirectory ? 'src/' : ''}${dependency}`,
            `${home}/${repo}/${process}/${hasSourceDirectory ? 'src/' : ''}${dependency}`
        ])
        if (isApi) {
            tempDirs.push([
                `/tmp/${repo}/${process}/${dependency}`,
                `${home}/${repo}/${process}/node_modules/${dependency}`,
            ])
        }
    }
}
