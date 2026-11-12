import { join } from 'path'
import getThemeKey from './getThemeKey.js'
import isFile from './isFile.js'
import {
    getContent,
    writeFile,
} from './os.js'

export default ({
    addVolume,
    containerHome,
    home,
    multiThemed,
    process,
    repo,
    siteCore,
    themeDirectories = [],
}) => {
    if (siteCore !== 'newSite') {
        addVolume(
            `${home}/site/buildRichTextRegistry.js`,
            `${containerHome}/${repo}/${process}/buildRichTextRegistry.js`,
        )
    }
    const configuration = {
        multiThemed,
        themeNumbers: themeDirectories.map(getThemeKey),
    }
    const themeTitles = {}
    const themeDescriptions = {}
    for (const directory of multiThemed ? themeDirectories : []) {
        const brandingPath = join(home, repo, directory, 'data', 'branding.json')
        const contentPath = join(home, repo, directory, 'data', 'home.json')
        const referencePath = join(home, repo, directory, 'data', 'originalHome.json')
        const branding = isFile(brandingPath) ? JSON.parse(getContent(brandingPath)) : null
        const content = isFile(contentPath) ? JSON.parse(getContent(contentPath)) : null
        const reference = isFile(referencePath) ? JSON.parse(getContent(referencePath))?.metadata : null
        const documentTitle = branding?.documentTitle || content?.seo?.metaTitle || content?.seo?.title || reference?.title
        const description = content?.seo?.metaDescription || content?.seo?.description || reference?.description
        if (documentTitle) themeTitles[getThemeKey(directory)] = documentTitle
        if (description) themeDescriptions[getThemeKey(directory)] = description
    }
    if (Object.keys(themeTitles).length) configuration.themeTitles = themeTitles
    if (Object.keys(themeDescriptions).length) configuration.themeDescriptions = themeDescriptions
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
