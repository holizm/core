import path from 'path'

export default ({
    processPath,
    readContent,
}) => {
    const configuration = JSON.parse(readContent(path.join(processPath, 'settingsOverride.json')) || '{}')
    const internal = configuration.runtime?.internal ?? false
    const readOnlyDirectories = configuration.runtime?.readOnlyDirectories ?? []
    if (typeof internal !== 'boolean' || !Array.isArray(readOnlyDirectories)) throw new TypeError('Invalid runtime settings')
    for (const directory of readOnlyDirectories) {
        if (typeof directory !== 'string' || !path.isAbsolute(directory) || path.normalize(directory) === '/'
            || /[\r\n\0]|\$\{/.test(directory)) throw new TypeError('Invalid read-only directory')
    }
    const runtime = {
        internal,
        readOnlyDirectories: [...new Set(readOnlyDirectories)],
    }
    return runtime
}
