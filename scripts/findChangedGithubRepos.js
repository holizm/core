import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'

import {
    measure,
    measureAsync,
} from './timing.js'

const execFileAsync = promisify(execFile)

const gitOutput = async (repo, args) => {
    try {
        const { stdout } = await execFileAsync('git', ['-C', repo, ...args], {
            encoding: 'utf8',
        })
        return stdout.trim()
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

const getRepoDetails = async (repo, index) => {
    const upstream = await gitOutput(repo, [
        'rev-parse',
        '--abbrev-ref',
        '--symbolic-full-name',
        '@{upstream}',
    ])
    const separator = upstream.indexOf('/')

    if (separator < 1) return null

    const remoteName = upstream.slice(0, separator)
    const branch = upstream.slice(separator + 1)
    const [remoteUrl, oid] = await Promise.all([
        gitOutput(repo, ['remote', 'get-url', remoteName]),
        gitOutput(repo, ['rev-parse', 'HEAD']),
    ])
    const remote = parseGithubRemote(remoteUrl)

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

const createQuery = (owner, cursor) => `query {
    repositoryOwner(login: ${JSON.stringify(owner)}) {
        repositories(first: 100${cursor ? `, after: ${JSON.stringify(cursor)}` : ''}) {
            nodes {
                name
                owner {
                    login
                }
                ref(qualifiedName: "refs/heads/main") {
                    target {
                        oid
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
}`

const getRepositoryKey = (owner, name) => `${owner}/${name}`.toLowerCase()

const requestOrganizationHeads = async (owner, token, timeoutMs) => {
    const nodes = []
    let cursor = null
    let hasNextPage = true

    while (hasNextPage) {
        const response = await fetch('https://api.github.com/graphql', {
            body: JSON.stringify({
                query: createQuery(owner, cursor),
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

        const repositories = result.data.repositoryOwner?.repositories
        nodes.push(...(repositories?.nodes || []))
        hasNextPage = repositories?.pageInfo?.hasNextPage || false
        cursor = repositories?.pageInfo?.endCursor || null
    }

    return nodes
}

const requestHeads = async (details, timeoutMs) => {
    const token = getToken()

    if (!token) throw new Error('GitHub authentication is unavailable')

    const owners = [...new Set(details.map(item => item.owner))]
    const nodes = (await Promise.all(owners.map(owner => requestOrganizationHeads(owner, token, timeoutMs)))).flat()
    const heads = new Map(nodes
        .filter(node => node.owner?.login && node.name)
        .map(node => [getRepositoryKey(node.owner.login, node.name), node.ref?.target?.oid]))
    const matched = details.filter(item => heads.has(getRepositoryKey(item.owner, item.name)))

    if (!matched.length) throw new Error('GitHub returned no matching repository heads')

    const result = Object.fromEntries(details.map(item => [item.alias, {
        oid: heads.get(getRepositoryKey(item.owner, item.name)),
    }]))
    return result
}

export default async (repos, timeoutMs) => {
    const details = (await Promise.all(repos.map((repo, index) => measureAsync(
        `pull: inspect ${repo}`,
        () => getRepoDetails(repo, index),
    ))))
        .filter(Boolean)
    const unchecked = measure('pull: identify unchecked repos', () => repos.filter(repo => !details.some(item => item.repo === repo)))

    if (!details.length) {
        const result = {
            changed: [],
            unchecked,
        }
        return result
    }

    const heads = await measureAsync('pull: request GitHub heads', () => requestHeads(details, timeoutMs))
    const changed = measure('pull: identify changed repos', () => details
        .filter(item => heads[item.alias]?.oid !== item.oid)
        .map(item => item.repo))
    const result = {
        changed,
        unchecked,
    }
    return result
}
