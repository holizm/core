import { runStreaming } from './terminal.js'

export default async ({
    containerName,
    isApi,
    isPanel,
    isSite,
}) => {
    if (isApi || isPanel || isSite) {
        const ready = isApi
            ?
            'apiReady'
            :
            isPanel
            ?
            'panelReady'
            :
            'siteReady'
        await runStreaming(`docker exec ${containerName} bash -c 'for attempt in {1..300}; do [ -f /tmp/${ready} ] && exit 0; sleep 1; done; exit 1'`)
    }
    if (isApi) await runStreaming(`docker exec ${containerName} bash -c 'npm run tests'`)
    if (isPanel || isSite) await runStreaming(`docker exec ${containerName} bash -c 'npm test'`)
}
