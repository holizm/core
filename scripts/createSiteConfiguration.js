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
        addVolume(
            `${home}/site/scripts/initializeAppearance.js`,
            `${containerHome}/${repo}/${process}/scripts/initializeAppearance.js`,
        )
    }
    const configuration = {
        multiThemed,
        themeNumbers: themeDirectories.map(getThemeKey),
    }
    const themeTitles = {}
    const themeDescriptions = {}
    const themeDefaultAppearances = {}
    const themeMetadata = {}
    const themeSources = {}
    const themeBranding = {}
    const themeViewports = {}
    for (const directory of multiThemed ? themeDirectories : []) {
        const declarationPath = join(home, repo, directory, 'theme.json')
        const declaration = isFile(declarationPath) ? JSON.parse(getContent(declarationPath)) : null
        if (typeof declaration?.source === 'string' && /^https?:\/\//i.test(declaration.source) && URL.canParse(declaration.source)) {
            themeSources[getThemeKey(directory)] = declaration.source
        }
        const brandingPath = join(home, repo, directory, 'data', 'branding.json')
        const contentPath = join(home, repo, directory, 'data', 'home.json')
        const referencePath = join(home, repo, directory, 'data', 'originalHome.json')
        const seoPath = join(home, repo, directory, 'data', 'seo.json')
        const branding = isFile(brandingPath) ? JSON.parse(getContent(brandingPath)) : null
        const content = isFile(contentPath) ? JSON.parse(getContent(contentPath)) : null
        const reference = isFile(referencePath) ? JSON.parse(getContent(referencePath))?.metadata : null
        const seo = isFile(seoPath) ? JSON.parse(getContent(seoPath)) : content?.seo
        const icons = branding?.icons || seo?.links?.filter(link => link.rel?.split(/\s+/).some(token => ['icon', 'apple-touch-icon'].includes(token)))
        if (branding || icons?.length) themeBranding[getThemeKey(directory)] = {
            ...branding,
            ...(icons?.length ? { icons } : {}),
        }
        const documentTitle = branding?.documentTitle || seo?.metaTitle || seo?.title || reference?.title
        const description = seo?.metaDescription || seo?.description || seo?.meta?.find(entry => entry.name === 'description')?.content || reference?.description
        const viewport = seo?.meta?.find(entry => entry.name === 'viewport')?.content
        const metadataLinks = seo?.links?.filter(link => ['canonical', 'alternate'].includes(link.rel)) || []
        if (seo?.canonical) metadataLinks.push({
            href: seo.canonical,
            rel: 'canonical',
        })
        const metadata = {
            links: metadataLinks,
            meta: seo?.meta,
        }
        if (metadata.links.length || metadata.meta?.length) themeMetadata[getThemeKey(directory)] = metadata
        if (documentTitle) themeTitles[getThemeKey(directory)] = documentTitle
        if (description) themeDescriptions[getThemeKey(directory)] = description
        if (viewport) themeViewports[getThemeKey(directory)] = viewport
        if (declaration?.defaultAppearance) themeDefaultAppearances[getThemeKey(directory)] = declaration.defaultAppearance
    }
    if (Object.keys(themeTitles).length) configuration.themeTitles = themeTitles
    if (Object.keys(themeDescriptions).length) configuration.themeDescriptions = themeDescriptions
    if (Object.keys(themeSources).length) configuration.themeSources = themeSources
    if (Object.keys(themeMetadata).length) configuration.themeMetadata = themeMetadata
    if (Object.keys(themeBranding).length) configuration.themeBranding = themeBranding
    if (Object.keys(themeViewports).length) configuration.themeViewports = themeViewports
    if (Object.keys(themeDefaultAppearances).length) configuration.themeDefaultAppearances = themeDefaultAppearances
    writeFile(
        `/tmp/${repo}/${process}/siteConfiguration.js`,
        `export default ${JSON.stringify(configuration, null, 4)}\n`,
    )
}
