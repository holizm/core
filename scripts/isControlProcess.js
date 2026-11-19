export default ({
    isControl,
    process,
    repo,
}) => (isControl || repo?.endsWith('Control')) && ['api', 'panel', 'worker'].includes(process)
