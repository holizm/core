export default ({
    isBuild,
    port,
    runtime,
}) => {
    const apiPortBindings = '        ports:\n            - "127.0.0.1:' + port + ':5000"'
    const apiReadOnlyMounts = isBuild ? '' : runtime.readOnlyDirectories.map(directory => [
        '            - type: bind',
        '              source: ' + JSON.stringify(directory),
        '              target: ' + JSON.stringify(directory),
        '              read_only: true',
        '              bind:',
        '                  create_host_path: false',
    ].join('\n')).join('\n')
    const settings = {
        apiPortBindings,
        apiReadOnlyMounts,
        processIsBuild: Boolean(isBuild),
    }
    return settings
}
