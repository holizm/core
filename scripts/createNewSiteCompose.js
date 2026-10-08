import {
    getContent,
    writeFile,
} from './os.js'

export default (template, output, params) => {
    const source = getContent(template)
    const content = source
        .replace(/^.*\$\{home\}\/site\/icons\/.*\n/gm, '')
        .replace(/^.*\$\{home\}\/site\/themeAssets\.js.*\n/gm, '')
        .replaceAll('${home}/site', '${home}/newSite')
        .replaceAll('${home}/packages/site', '${home}/packages/newSite')
        .replace('            - deterministicPort=${deterministicPort}', '            - deterministicPort=${deterministicPort}\n            - npm_config_legacy_peer_deps=true')
        .replace('            merge site', '            merge site\n            installPackages')
        .replace(/\$\{(\w+)\}/g, (_, key) => params[key] || '')
    writeFile(output, content)
}
