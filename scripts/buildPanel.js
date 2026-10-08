import {
    runOnTerminalAsync,
    runStreaming,
} from './terminal.js'

export const buildPanel = async params => {
    const {
        containerName,
        processBuildDir,
        processPath,
    } = params
    await runStreaming(`docker exec ${containerName} bash -c 'for attempt in {1..300}; do [ -f /tmp/panelReady ] && exit 0; sleep 1; done; exit 1'`)
    await runStreaming(`docker exec ${containerName} bash -c 'node ./validatePanelUi.js && npm run build'`)
    const command = `
        docker exec ${containerName} bash -c '
            cd '${processPath}/dist' &&
            tar -cf - .
        ' | tar -xf - -C ${processBuildDir}
    `
    await runOnTerminalAsync(command)
}
