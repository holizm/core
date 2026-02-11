import { runOnTerminal } from './terminal.js'

export default params => {
    runOnTerminal(`find ${params.buildPath} -type d -name ".git" | xargs rm -rf`)
}
