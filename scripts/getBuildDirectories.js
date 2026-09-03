export default params => {
    const buildDir = `/tmp/${params.repo}${params.pascalizedProcess}Build`
    const directories = {
        buildDir,
        processBuildDir: `${buildDir}/${params.repo}/${params.process}`,
    }
    return directories
}
