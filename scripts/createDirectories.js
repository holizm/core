import getDependencies from './getDependencies.js'
import { createDirIfNotExists, removeAndRecreateDir } from './os.js'

export default params => {
    const {
        containerHome,
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
    if (isApi) {
        removeAndRecreateDir('/tmp/spl')
    }
    const tempDirs = [
        [`/tmp/${repo}`, `${containerHome}/${repo}`],
        [`/tmp/${repo}/common`, `${containerHome}/${repo}/common`],
        [`/tmp/${repo}/${process}`, `${containerHome}/${repo}/${process}`],
        [`/tmp/${repo}/${process}/ast`, `${containerHome}/${repo}/${process}/ast`],
        [`/tmp/${repo}/${process}/node_modules`, `${containerHome}/${repo}/${process}/node_modules`],
        `/var/tmp/${repo}`,
        `/var/tmp/${repo}/${processType}`,
        `/var/tmp/${repo}/${processType}/nodeModules`,
        `/var/tmp/${processType}`,
        `/var/tmp/${processType}/nodeModules`,
        [`/tmp/spl`, `${containerHome}/spl`],
        [`${home}/packages`, `${containerHome}/packages`],
        [`${home}/packages/${processType}`, `${containerHome}/packages/${processType}`],
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
