import fs from 'fs'
import os from 'os'
import path from 'path'
import getApiIamSettings from './getApiIamSettings.js'
import runOnServer from './runOnServer.js'
import { runStreaming } from './terminal.js'

export default async ({
    domain,
    params,
    remoteBuildDir,
    remoteProcessPath,
}) => {
    if (!params.isApi) return
    const settings = getApiIamSettings(params)
    if (!settings.production.adminApi.iamClientSecrets.length) return
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'apiIamSettings'))
    const settingsPath = path.join(temporaryDirectory, 'iamSettings.json')
    try {
        fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 4)}\n`, { mode: 0o600 })
        await runStreaming(`serverCopy ${settingsPath} ${domain}:${remoteBuildDir}/iamSettings.json`)
        await runOnServer(domain, `install -m 600 ${remoteBuildDir}/iamSettings.json ${remoteProcessPath}/iamSettings.json`)
    }
    finally {
        fs.rmSync(temporaryDirectory, {
            force: true,
            recursive: true,
        })
    }
}
