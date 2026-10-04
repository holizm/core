import { writeFile } from './os.js'

export default ({
    multiThemed,
    process,
    repo,
    themeDirectories = [],
}) => {
    const configuration = {
        multiThemed,
        themeNumbers: themeDirectories.map(directory => directory.slice('theme'.length)),
    }
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
