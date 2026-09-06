import fs from 'node:fs'

export default params => {
    const {
        buildDir,
        processBuildDir,
    } = params
    fs.copyFileSync(
        `${buildDir}/core/essentialParts`,
        `${processBuildDir}/node_modules/core/essentialParts`,
    )
}
