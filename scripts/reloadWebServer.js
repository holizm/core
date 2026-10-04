import { runOnTerminal } from './terminal.js'
import pruneInactiveWebServerConfigs from './pruneInactiveWebServerConfigs.js'

export default params => {
    const {
        containerName,
        home,
    } = params
    const activeContainers = runOnTerminal("docker ps --format '{{.Names}}'", {
        throwOnError: true,
    }).split('\n').filter(Boolean)
    pruneInactiveWebServerConfigs({
        activeContainers,
        home,
        keepContainerName: containerName,
        root: '/tmp',
    })
    const setupCommand = `sudo env homeDir=${home} node ${home}/core/setupDev/nginx`
    const reloadCommand = 'sudo nginx -t && (sudo systemctl is-active --quiet nginx && sudo systemctl reload nginx || sudo systemctl start nginx) 1>/dev/null 2>&1'
    return runOnTerminal(`${setupCommand} && ${reloadCommand}`)
}
