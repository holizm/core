import fs from 'fs'
import path from 'path'

const bindPattern = /^(\s*)- (\/[^:]+):([^:]+)(:ro)?$/

const convertBind = line => {
    const match = line.match(bindPattern)
    if (!match) {
        return line
    }
    const [
        ,
        indentation,
        source,
        target,
        readOnly,
    ] = match
    const lines = [
        `${indentation}- type: bind`,
        `${indentation}  source: ${source}`,
        `${indentation}  target: ${target}`,
    ]
    if (readOnly) {
        lines.push(`${indentation}  read_only: true`)
    }
    lines.push(`${indentation}  bind:`)
    lines.push(`${indentation}      create_host_path: false`)
    return lines.join('\n')
}

const getBindSources = content => [...content.matchAll(/^\s+source: (\/.*)$/gm)].map(match => match[1])

const getBinds = content => [...content.matchAll(/^[ \t]*- type: bind\n[ \t]+source: (\/.*)\n[ \t]+target: (\/.*)$/gm)].map(match => {
    const bind = {
        source: match[1],
        target: match[2],
    }
    return bind
})

const pathIsInside = (childPath, parentPath) => childPath.startsWith(`${parentPath}/`)

const ensureMatchingType = (source, target) => {
    const sourceStat = fs.statSync(source)
    if (fs.existsSync(target)) {
        const targetStat = fs.statSync(target)
        if (sourceStat.isDirectory() !== targetStat.isDirectory()) {
            throw new Error(`Bind mount target type does not match its source:\n${source}\n${target}`)
        }
        return
    }
    if (sourceStat.isDirectory()) {
        fs.mkdirSync(target, { recursive: true })
        return
    }
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.closeSync(fs.openSync(target, 'w'))
}

const ensureNestedBindTargets = binds => {
    const sortedBinds = [...binds].sort((a, b) => b.target.length - a.target.length)
    for (const bind of binds) {
        const parentBind = sortedBinds.find(candidate =>
            candidate !== bind && pathIsInside(bind.target, candidate.target)
        )
        if (!parentBind) {
            continue
        }
        const relativeTarget = path.relative(parentBind.target, bind.target)
        const hostTarget = path.join(parentBind.source, relativeTarget)
        ensureMatchingType(bind.source, hostTarget)
    }
}

export default composePath => {
    const content = fs.readFileSync(composePath, 'utf8')
    const normalizedContent = content
        .split('\n')
        .map(convertBind)
        .join('\n')
    const missingSources = getBindSources(normalizedContent).filter(source => !fs.existsSync(source))
    if (missingSources.length > 0) {
        throw new Error(`Missing bind mount sources in ${composePath}:\n${missingSources.join('\n')}`)
    }
    ensureNestedBindTargets(getBinds(normalizedContent))
    if (normalizedContent !== content) {
        fs.writeFileSync(composePath, normalizedContent)
    }
    return composePath
}
