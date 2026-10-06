import { tmpdir } from 'os'

export default params => {
    const buildDir = `${tmpdir()}/${params.repo}${params.pascalizedProcess}Build`
    const directories = {
        buildDir,
        processBuildDir: `${buildDir}/${params.repo}/${params.process}`,
    }
    return directories
}
