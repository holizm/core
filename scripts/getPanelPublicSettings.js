import {
    existsSync,
    readFileSync,
} from 'fs'

const mergeSettings = (target, source) => {
    const result = { ...target }
    for (const [key, value] of Object.entries(source)) {
        const previous = result[key]
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
            ? mergeSettings(previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {}, value)
            : value
    }
    return result
}

export default (publicCommonFile, publicSettingsFile) => {
    const publicCommon = JSON.parse(readFileSync(publicCommonFile, 'utf8'))
    const publicSettings = existsSync(publicSettingsFile)
        ? JSON.parse(readFileSync(publicSettingsFile, 'utf8'))
        : {}
    const settings = mergeSettings(publicCommon, publicSettings)
    return settings
}
