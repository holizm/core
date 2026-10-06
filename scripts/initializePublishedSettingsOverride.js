import isFile from './isFile.js'
import runOnServer from './runOnServer.js'
import { runStreaming } from './terminal.js'

export default async ({
    domain,
    remoteBuildDir,
    remoteProcessPath,
    settingsOverridePath,
}) => {
    if (!isFile(settingsOverridePath)) return
    await runStreaming(`serverCopy ${settingsOverridePath} ${domain}:${remoteBuildDir}/settingsOverride.json`)
    await runOnServer(
        domain,
        `[ -f ${remoteProcessPath}/settingsOverride.json ] || cp ${remoteBuildDir}/settingsOverride.json ${remoteProcessPath}/settingsOverride.json`,
    )
}
