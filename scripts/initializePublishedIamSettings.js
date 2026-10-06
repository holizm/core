import fs from 'fs'
import { lookup } from 'dns/promises'
import os from 'os'
import path from 'path'
import getApiIamSettings from './getApiIamSettings.js'
import runOnServer from './runOnServer.js'
import { runStreaming } from './terminal.js'

export default async ({
    domain,
    instance,
    params,
    remoteBuildDir,
    remoteProcessPath,
}) => {
    if (!params.isApi) return
    const settings = getApiIamSettings(params)
    const addresses = await lookup(`accounts.${domain}`, { all: true })
    settings.iam = Object.fromEntries(addresses
        .filter(address => settings.iam[address.address])
        .map(address => [address.address, settings.iam[address.address]]))
    if (!settings.production.adminApi.iamClientSecrets.length && !Object.keys(settings.iam).length) return
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'apiIamSettings'))
    const settingsPath = path.join(temporaryDirectory, 'iamSettings.json')
    try {
        fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 4)}\n`, { mode: 0o600 })
        await runStreaming(`serverCopy ${settingsPath} ${domain}:${remoteBuildDir}/iamSettings.json`)
        await runOnServer(domain, `/holism/server/commands/updateIamSettings ${instance.serverDirectory} ${remoteBuildDir}/iamSettings.json`)
        await runOnServer(domain, `rm -f ${remoteProcessPath}/iamSettings.json`)
    }
    finally {
        fs.rmSync(temporaryDirectory, {
            force: true,
            recursive: true,
        })
    }
}
