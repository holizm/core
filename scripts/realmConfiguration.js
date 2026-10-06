import fs from 'fs'
import path from 'path'
import camelize from './camelize.js'

const hasControlDeployment = ({
    domain,
    repo,
    secretsDirectory,
}) => {
    const controlSecretPath = path.join(secretsDirectory, `${repo}Control.json`)
    if (!fs.existsSync(controlSecretPath)) return false
    const controlSecrets = JSON.parse(fs.readFileSync(controlSecretPath, 'utf8'))
    return controlSecrets.deployment?.instances?.some(instance => instance.domain === domain)
}

export const getRealmConfiguration = domain => {
    const secretsDirectory = path.join(process.env.HOME, 'secrets')
    const matches = fs.readdirSync(secretsDirectory)
        .filter(file => file.endsWith('.json') && !file.endsWith('Control.json') && !file.endsWith('Themes.json'))
        .flatMap(file => {
            const secretPath = path.join(secretsDirectory, file)
            const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'))
            return (secrets.deployment?.instances || [])
                .filter(instance => instance.domain === domain)
                .map(instance => ({
                    instance,
                    repo: secrets.deployment.vcsRepo,
                    secretPath,
                }))
        })
    if (matches.length !== 1) throw new Error(`Expected one deployment for ${domain}; found ${matches.length}`)
    const deployment = matches[0]
    const tenantsPath = path.join(process.env.HOME, deployment.repo, 'common', 'tenants')
    const line = fs.readFileSync(tenantsPath, 'utf8')
        .split('\n')
        .map(value => value.trim())
        .find(value => value && !value.startsWith('#') && value.split(/\s+/)[1] === domain)
    if (!line) throw new Error(`No tenant for ${domain} in ${tenantsPath}`)
    const [name, , , , ...options] = line.split(/\s+/)
    const roles = options.flatMap(option => option.split(','))
        .filter(role => role && !role.includes('theme'))
        .map(camelize)
    if (hasControlDeployment({
        domain,
        repo: deployment.repo,
        secretsDirectory,
    })) roles.push('control')
    const configuration = {
        ...deployment,
        domain,
        realm: camelize(name),
        roles: [...new Set(['admin', 'superAdmin', ...roles])],
    }
    return configuration
}

export const getRealmClients = configuration => {
    const names = ['adminApi', 'adminPanel', 'site', 'siteApi']
    configuration.roles.filter(role => !['admin', 'superAdmin'].includes(role))
        .forEach(role => names.push(`${role}Api`, `${role}Panel`))
    const clients = names.map(name => {
        const isApi = name.endsWith('Api')
        const isPanel = name.endsWith('Panel')
        const baseName = name.replace(/Api$|Panel$/, '').toLowerCase()
        let subdomain = baseName
        if (isApi) subdomain = baseName === 'site' ? 'api' : `api.${baseName}`
        const origin = name === 'site'
            ?
            `https://${configuration.domain}`
            :
            `https://${subdomain}.${configuration.domain}`
        const client = {
            clientId: name,
            directAccessGrantsEnabled: isApi || name === 'site',
            publicClient: isPanel,
            redirectUris: [`${origin}/*`],
            serviceAccountsEnabled: name === 'adminApi',
            standardFlowEnabled: !isApi,
            webOrigins: [origin],
        }
        if (!isPanel) client.clientAuthenticatorType = 'client-secret'
        return client
    })
    return clients
}
