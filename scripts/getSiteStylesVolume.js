export default ({
    containerHome,
    process,
    processPath,
    repo,
}) => `- ${processPath}/styles:${containerHome}/${repo}/${process}/styles`
