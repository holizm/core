import { execFileSync } from 'node:child_process'

const gitOutput = (repo, args) => {
    try {
        return execFileSync('git', ['-C', repo, ...args], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
    } catch (e) {
        return ''
    }
}

const parseGithubRemote = remoteUrl => {
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i)

    if (!match) return null

    const remote = {
        name: match[2],
        owner: match[1],
    }
    return remote
}

const getRepoDetails = (repo, index) => {
    const upstream = gitOutput(repo, [
        'rev-parse',
        '--abbrev-ref',
        '--symbolic-full-name',
        '@{upstream}',
    ])
    const separator = upstream.indexOf('/')

    if (separator < 1) return null

    const remoteName = upstream.slice(0, separator)
    const branch = upstream.slice(separator + 1)
    const remoteUrl = gitOutput(repo, ['remote', 'get-url', remoteName])
    const remote = parseGithubRemote(remoteUrl)
    const oid = gitOutput(repo, ['rev-parse', 'HEAD'])

    if (!branch || !oid || !remote) return null

    const details = {
        alias: `repo${index}`,
        branch,
        name: remote.name,
        oid,
        owner: remote.owner,
        repo,
    }
    return details
}

const getToken = () => {
    if (process.env.GH_TOKEN) return process.env.GH_TOKEN
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN

    try {
        return execFileSync('gh', ['auth', 'token'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
    } catch (e) {
        return ''
    }
}

const createQuery = details => `query {
${details.map(item => `    ${item.alias}: repository(owner: ${JSON.stringify(item.owner)}, name: ${JSON.stringify(item.name)}) {
        ref(qualifiedName: ${JSON.stringify(`refs/heads/${item.branch}`)}) {
            target {
                oid
            }
        }
    }`).join('\n')}
}`

const requestHeads = async (details, timeoutMs) => {
    const token = getToken()

    if (!token) throw new Error('GitHub authentication is unavailable')

    const response = await fetch('https://api.github.com/graphql', {
        body: JSON.stringify({
            query: createQuery(details),
        }),
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'holizm-core-pull',
        },
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`)

    const result = await response.json()

    if (!result.data) throw new Error(result.errors?.[0]?.message || 'GitHub returned no repository data')

    return result.data
}

export default async (repos, timeoutMs) => {
    const details = repos
        .map(getRepoDetails)
        .filter(Boolean)
    const unchecked = repos.filter(repo => !details.some(item => item.repo === repo))

    if (!details.length) {
        const result = {
            changed: [],
            unchecked,
        }
        return result
    }

    const heads = await requestHeads(details, timeoutMs)
    const changed = details
        .filter(item => heads[item.alias]?.ref?.target?.oid !== item.oid)
        .map(item => item.repo)
    const result = {
        changed,
        unchecked,
    }
    return result
}
