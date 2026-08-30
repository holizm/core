import { runOnTerminal } from './terminal.js'

export default params => {
    const { home } = params
    const setupCommand = `sudo env homeDir=${home} node ${home}/core/setupDev/nginx`
    const reloadCommand = 'sudo nginx -t && (sudo systemctl is-active --quiet nginx && sudo systemctl reload nginx || sudo systemctl start nginx) 1>/dev/null 2>&1'
    return runOnTerminal(`${setupCommand} && ${reloadCommand}`)
}
