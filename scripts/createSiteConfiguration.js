import { writeFile } from './os.js'

export default ({
    multiThemed,
    process,
    repo,
}) => {
    const configuration = {
        multiThemed,
    }
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
