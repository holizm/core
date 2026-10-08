import { chmodSync } from 'fs'
import getApiIamSettings from './getApiIamSettings.js'
import getSiteIamSettings from './getSiteIamSettings.js'
import isControlRunnable from './isControlRunnable.js'
import isFile from './isFile.js'
import {
    writeFile,
    writeFileIfNotExists,
} from './os.js'

export default params => {
    const {
        connectionStringsPath,
        containerHome,
        home,
        privateSettingsPath,
        process,
        processType,
        publicSettingsPath,
        repo,
        settingsOverridePath,
    } = params
    const hasPublicSide = ['panel', 'site'].includes(processType)
    const isControl = isControlRunnable(params)
    const items = processType === 'panel'
        ? [
            [publicSettingsPath, 'publicSettings.json'],
            [settingsOverridePath, 'settingsOverride.json'],
        ]
        : [
            [connectionStringsPath, 'connectionStrings.json'],
            [privateSettingsPath, 'privateSettings.json'],
            [publicSettingsPath, 'publicSettings.json'],
            [settingsOverridePath, 'settingsOverride.json'],
        ]
    for (const [sourcePath, filename] of items) {
        const isPublicSetting = ['publicSettings.json', 'settingsOverride.json'].includes(filename)
        const resolvedPath = isFile(sourcePath)
            ?
            sourcePath
            :
            isControl
                ?
                `/tmp/${repo}/${process}/settings/${filename}`
                :
                null
        if (resolvedPath) {
            if (!isFile(sourcePath)) writeFile(resolvedPath, '{}\n')
            const targetDirectory =
                isPublicSetting && hasPublicSide
                ?
                'public/'
                :
                ''
            params.addVolume(resolvedPath, `${containerHome}/${repo}/${process}/${targetDirectory}${filename}`)
        }
    }
    if (processType !== 'panel') {
        const privateCommonFile = `${home}/secrets/privateCommon.json`
        const publicCommonFile = `${home}/secrets/publicCommon.json`
        const repoFile = `${home}/secrets/${repo}.json`
        writeFileIfNotExists(privateCommonFile, '{}')
        writeFileIfNotExists(publicCommonFile, '{}')
        writeFileIfNotExists(repoFile, '{}')
        chmodSync(privateCommonFile, 0o600)
        chmodSync(publicCommonFile, 0o600)
        chmodSync(repoFile, 0o600)
        params.addVolume(privateCommonFile, `${containerHome}/${repo}/${process}/privateCommon.json:ro`)
        params.addVolume(publicCommonFile, `${containerHome}/${repo}/${process}/publicCommon.json:ro`)
        if (processType === 'api') {
            params.addVolume(repoFile, `${containerHome}/${repo}/${process}/repo.json:ro`)
        }
    }
    if (processType === 'api') {
        const iamSettingsPath = `/tmp/${repo}/${process}/settings/iamSettings.json`
        writeFile(iamSettingsPath, `${JSON.stringify(getApiIamSettings(params), null, 4)}\n`)
        chmodSync(iamSettingsPath, 0o600)
        params.addVolume(iamSettingsPath, `${containerHome}/${repo}/${process}/iamSettings.json`)
    }
    if (processType === 'site') {
        const iamSettingsPath = `/tmp/${repo}/${process}/settings/siteIamSettings.json`
        writeFile(iamSettingsPath, `${JSON.stringify(getSiteIamSettings(params), null, 4)}\n`)
        chmodSync(iamSettingsPath, 0o600)
        params.addVolume(iamSettingsPath, `${containerHome}/${repo}/${process}/siteIamSettings.json:ro`)
    }
}
