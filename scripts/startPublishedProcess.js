import camelize from './camelize.js'
import getRemoteExecutable from './getRemoteExecutable.js'
import runOnServer from './runOnServer.js'

const pm2Paths = [
    '/usr/local/node/bin/pm2',
    '/usr/local/bin/pm2',
    '/usr/bin/pm2',
]

const servePaths = [
    '/usr/local/node/bin/serve',
    '/usr/local/bin/serve',
    '/usr/bin/serve',
]

export default async ({
    domain,
    instance,
    params,
}) => {
    const {
        isApi,
        isPanel,
        isSite,
        process,
    } = params
    const processPath = `$HOME/${instance?.serverDirectory}/${process}`
    const fullProcessName = camelize(`${instance?.serverDirectory} ${process}`)
    const pm2 = await getRemoteExecutable(domain, 'PM2', pm2Paths)
    const port = (await runOnServer(
        domain,
        `grep -oP '127\\.0\\.0\\.1:\\K[0-9]+' ${processPath}/compose.yaml | head -n1`,
        true,
    )).trim()
    const restart = command => runOnServer(
        domain,
        `cd ${processPath} && (${pm2} delete ${fullProcessName} || true) && ${command}`,
    )

    if (isApi) {
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/common/connectionStrings.json ${processPath}/connectionStrings.json`)
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/common/publicSettings.json ${processPath}/publicSettings.json`)
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/common/privateSettings.json ${processPath}/privateSettings.json`)
        await restart(`${pm2} start process.js --name ${fullProcessName} --update-env -- ${port}`)
    }
    else if (isPanel) {
        const serve = await getRemoteExecutable(domain, 'Serve', servePaths)
        await runOnServer(domain, `cp -f $HOME/${instance?.serverDirectory}/common/publicSettings.json ${processPath}/publicSettings.json`)
        await runOnServer(domain, `cp -f $HOME/${instance?.serverDirectory}/tenants ${processPath}/tenants`)
        await restart(`${pm2} start ${serve} --name ${fullProcessName} -- -s . -l ${port}`)
    }
    else if (isSite) {
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/tenants ${processPath}/tenants`)
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/common/privateSettings.json ${processPath}/privateSettings.json`)
        await runOnServer(domain, `ln -s -f $HOME/${instance?.serverDirectory}/common/publicSettings.json ${processPath}/dist/publicSettings.json`)
        await runOnServer(domain, `ln -s -f ${processPath}/settingsOverride.json ${processPath}/dist/settingsOverride.json`)
        await restart(`PORT=${port} ${pm2} start server/entry.express.js --name ${fullProcessName}`)
    }
}
