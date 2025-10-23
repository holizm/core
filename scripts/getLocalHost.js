import { isFile } from "./os.js"

export default params => {
    let {
        domain,
        process,
        siteFilePath,
    } = params
    domain = domain.trim()
    const parts = domain.split(".")
    if (parts.length > 1) {
        parts[parts.length - 1] = "local"
    } else {
        parts.push("local")
    }
    const baseDomain = parts.join(".")
    let clean = process
    for (const affix of ["Site", "Panel", "Api", "Databases", "New"]) {
        clean = clean.replaceAll(affix, "")
    }
    if (isFile(siteFilePath)) clean = ""
    clean = clean.trim().toLowerCase()
    const subdomains = []

    if (process.includes("Api")) subdomains.push("api")
    if (process.includes("New")) subdomains.push("new")
    if (clean) subdomains.push(clean)

    const subdomainPrefix = subdomains.join(".")

    return subdomainPrefix
        ?
        `${subdomainPrefix}.${baseDomain}`
        :
        baseDomain
}
