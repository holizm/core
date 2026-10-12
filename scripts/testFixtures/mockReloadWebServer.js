export default params => globalThis.mockWebServerCalls.push(['prune', params])

export const runOnTerminal = (command, options) => {
    globalThis.mockWebServerCalls.push(['terminal', command, options])
    return command.startsWith('docker ps')
        ?
        'shopApi\nshopPanel'
        :
        'reloaded'
}
