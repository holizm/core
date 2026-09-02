import {
    createDirIfNotExists,
    deleteFile,
    removeAndRecreateDir,
} from './os.js'

export default params => {
    const {
        containerHome,
        dependencies,
        extraDirectories,
        home,
        process,
        processType,
        repo,
    } = params
    // rmSync(`/tmp/${repo}/${process}`, { recursive: true })
    const hasRunnableDirectory = processType === 'panel'
    const hasSourceDirectory = [
        'panel',
        'site',
    ].includes(processType)
    const processIsApi = processType === 'api'
    const splPath = `/tmp/${repo}/${process}/spl`
    if (processIsApi) {
        removeAndRecreateDir(splPath)
        removeAndRecreateDir(`/tmp/${repo}/${process}/node_modules`)
        if (process.startsWith('admin')) {
            for (const utility of [
                'generation',
                'migration',
                'query',
                'toMongo',
            ]) {
                deleteFile(`/tmp/${repo}/${process}/${utility}`)
            }
        }
    }

    const directoryEntries = [
        [
            `/tmp/${repo}`,
            `${containerHome}/${repo}`,
        ],
        [
            `/tmp/${repo}/common`,
            `${containerHome}/${repo}/common`,
        ],
        [
            `/tmp/${repo}/${process}`,
            `${containerHome}/${repo}/${process}`,
        ],
        [
            `/tmp/${repo}/${process}/ast`,
            `${containerHome}/${repo}/${process}/ast`,
        ],
        [
            `/tmp/${repo}/${process}/node_modules`,
            `${containerHome}/${repo}/${process}/node_modules`,
        ],
        `/var/tmp/${repo}`,
        `/var/tmp/${repo}/${processType}`,
        `/var/tmp/${repo}/${processType}/nodeModules`,
        `/var/tmp/${processType}`,
        `/var/tmp/${processType}/nodeModules`,
        [
            splPath,
            `${containerHome}/spl`,
        ],
        [
            `${home}/packages`,
            `${containerHome}/packages`,
        ],
        [
            `${home}/packages/${processType}`,
            `${containerHome}/packages/${processType}`,
        ],
    ]
    if (extraDirectories) {
        directoryEntries.push(...extraDirectories)
    }
    if (hasSourceDirectory) {
        directoryEntries.push([
            `/tmp/${repo}/${process}/src`,
            `${home}/${repo}/${process}/src`,
        ])
    }
    if (hasRunnableDirectory) {
        directoryEntries.push([
            `/tmp/${repo}/${process}/runnable`,
            `${home}/${repo}/${process}/src/runnable`,
        ])
    }

    for (const directoryEntry of directoryEntries) {
        if (Array.isArray(directoryEntry)) {
            const [
                sourcePath,
                targetPath,
            ] = directoryEntry
            createDirIfNotExists(sourcePath)
            params.addVolume(sourcePath, targetPath)
        }
        else {
            createDirIfNotExists(directoryEntry)
        }
    }

    const sourceDirectory =
        hasSourceDirectory
        ?
        'src/'
        :
        ''
    for (const dependency of dependencies) {
        directoryEntries.push([
            `/tmp/${repo}/${process}/${sourceDirectory}${dependency}`,
            `${home}/${repo}/${process}/${sourceDirectory}${dependency}`,
        ])
        if (processIsApi) {
            directoryEntries.push([
                `/tmp/${repo}/${process}/${dependency}`,
                `${home}/${repo}/${process}/node_modules/${dependency}`,
            ])
        }
    }
}
