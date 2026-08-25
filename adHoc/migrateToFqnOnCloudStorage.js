import {
    existsSync,
    readFileSync,
} from 'node:fs'
import {
    basename,
    dirname,
    join,
    resolve,
} from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import {
    CopyObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    S3Client,
} from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import fg from 'fast-glob'
import camelCase from 'lodash.camelcase'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const home = resolve(currentDirectory, '../..')

const parseArguments = () => Object.fromEntries(
    process.argv
        .slice(2)
        .filter(argument => argument.includes('='))
        .map(argument => {
            const separator = argument.indexOf('=')
            return [
                argument.slice(0, separator),
                argument.slice(separator + 1),
            ]
        })
)

const readJson = filePath => {
    const camelize = value => {
        if (Array.isArray(value)) {
            return value.map(camelize)
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, item]) => [
                    camelCase(key),
                    camelize(item),
                ])
            )
        }
        return value
    }
    return camelize(JSON.parse(readFileSync(filePath, 'utf8')))
}

const getSettings = repo => {
    const secretsPath = join(home, 'secrets', `${repo}.json`)
    if (!existsSync(secretsPath)) {
        throw new Error(`Secrets file does not exist: ${secretsPath}`)
    }
    return readJson(secretsPath)
}

const getPartFiles = async repo => {
    const partFiles = new Set()
    const dependencyFiles = [
        join(home, 'core/essentialParts'),
        join(home, repo, 'common/dependencies'),
    ]
    for (const dependencyFile of dependencyFiles) {
        if (!existsSync(dependencyFile)) {
            continue
        }
        for (const line of readFileSync(dependencyFile, 'utf8').split('\n')) {
            const part = line.trim()
            const partFile = join(home, part, 'part')
            if (part && existsSync(partFile)) {
                partFiles.add(partFile)
            }
        }
    }
    const nichePartFiles = await fg(`${home}/${repo}/**/part`, {
        ignore: [
            '**/node_modules/**',
        ],
        onlyFiles: true,
    })
    nichePartFiles.forEach(partFile => partFiles.add(partFile))
    return [...partFiles]
}

const getPartDefinitions = async repo => {
    const partsByName = new Map()
    const partsByType = new Map()
    const partFiles = await getPartFiles(repo)
    for (const partFile of partFiles) {
        const part = basename(dirname(partFile))
        const types = readFileSync(partFile, 'utf8')
            .split('\n')
            .filter(line => line && !/^\s/.test(line))
            .map(line => line.trim().split(/\s+/)[0])
        partsByName.set(part.toLowerCase(), {
            part,
            types,
        })
        for (const type of types) {
            const normalizedType = type.toLowerCase()
            const candidates = partsByType.get(normalizedType) || []
            candidates.push({
                part,
                type,
            })
            partsByType.set(normalizedType, candidates)
        }
    }
    return {
        partsByName,
        partsByType,
    }
}

const listDirectory = async (client, bucket, prefix) => {
    const directories = new Set()
    let continuationToken
    let directFileCount = 0
    do {
        const response = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            Delimiter: '/',
            Prefix: prefix,
        }))
        for (const object of response.Contents || []) {
            if (object.Key !== prefix) {
                directFileCount += 1
            }
        }
        for (const item of response.CommonPrefixes || []) {
            directories.add(item.Prefix)
        }
        continuationToken = response.IsTruncated
            ?
            response.NextContinuationToken
            :
            undefined
    } while (continuationToken)
    return {
        directFileCount,
        directories: [...directories].sort(),
    }
}

const getPathName = prefix => prefix.replace(/\/$/, '').split('/').at(-1)

const discoverPaths = async params => {
    const {
        bucket,
        client,
        partsByName,
        partsByType,
    } = params
    const root = await listDirectory(client, bucket, '')
    const legacyPaths = []
    const newPaths = []
    const unknownPaths = []
    for (const prefix of root.directories) {
        const name = getPathName(prefix)
        const partDefinition = partsByName.get(name.toLowerCase())
        const typeCandidates = partsByType.get(name.toLowerCase()) || []
        const directory = await listDirectory(client, bucket, prefix)
        if (typeCandidates.length > 0 && directory.directFileCount > 0) {
            legacyPaths.push({
                fileCount: directory.directFileCount,
                path: prefix,
                targets: typeCandidates.map(candidate => `${candidate.part}/${candidate.type}/`),
            })
        }
        if (partDefinition) {
            const types = new Map(
                partDefinition.types.map(type => [
                    type.toLowerCase(),
                    type,
                ])
            )
            for (const typePrefix of directory.directories) {
                const typeName = getPathName(typePrefix)
                const type = types.get(typeName.toLowerCase())
                if (type) {
                    newPaths.push({
                        path: typePrefix,
                        target: `${partDefinition.part}/${type}/`,
                    })
                }
                else {
                    unknownPaths.push(typePrefix)
                }
            }
        }
        else if (typeCandidates.length === 0) {
            unknownPaths.push(prefix)
        }
    }
    return {
        legacyPaths,
        newPaths,
        rootDirectoryCount: root.directories.length,
        unknownPaths,
    }
}

const printDiscovery = discovery => {
    console.info(`Found ${discovery.rootDirectoryCount} root directories.`)
    console.info(`Legacy paths: ${discovery.legacyPaths.length}`)
    for (const item of discovery.legacyPaths) {
        console.info(`${item.path} (${item.fileCount} files) -> ${item.targets.join(' or ')}`)
    }
    console.info(`New paths: ${discovery.newPaths.length}`)
    for (const item of discovery.newPaths) {
        console.info(`${item.path} -> ${item.target}`)
    }
    console.info(`Unknown paths: ${discovery.unknownPaths.length}`)
    for (const path of discovery.unknownPaths) {
        console.info(path)
    }
}

const copySource = (bucket, key) => encodeURIComponent(`${bucket}/${key}`)
    .replaceAll('%2F', '/')

const getObject = async (client, bucket, key) => {
    try {
        return await client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        }))
    }
    catch (exception) {
        if (
            exception.$metadata?.httpStatusCode === 404 ||
            exception.name === 'NotFound'
        ) {
            return
        }
        throw exception
    }
}

const runWithConcurrency = async (items, concurrency, callback) => {
    let nextIndex = 0
    const worker = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex
            nextIndex += 1
            await callback(items[index])
        }
    }
    await Promise.all(
        Array.from(
            {
                length: Math.min(concurrency, items.length),
            },
            worker
        )
    )
}

const copyLegacyPath = async params => {
    const {
        bucket,
        client,
        concurrency,
        destinationPrefix,
        dryRun,
        sourcePrefix,
        totalFileCount,
    } = params
    let continuationToken
    let copiedFileCount = 0
    let failedFileCount = 0
    let processedFileCount = 0
    let skippedFileCount = 0
    do {
        const response = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            Delimiter: '/',
            Prefix: sourcePrefix,
        }))
        const objects = (response.Contents || []).filter(object => object.Key !== sourcePrefix)
        await runWithConcurrency(objects, concurrency, async object => {
            const fileName = object.Key.slice(sourcePrefix.length)
            const destinationKey = `${destinationPrefix}${fileName}`
            if (dryRun) {
                processedFileCount += 1
                const percentage = Math.floor(
                    processedFileCount / totalFileCount * 100
                )
                console.info(`[${processedFileCount}/${totalFileCount} ${percentage}%] ${object.Key} -> ${destinationKey}`)
                return
            }
            let failure
            let status
            try {
                const destination = await getObject(client, bucket, destinationKey)
                if (destination) {
                    if (
                        destination.ContentLength !== object.Size ||
                        destination.ETag !== object.ETag
                    ) {
                        throw new Error(`Destination has different content: ${destinationKey}`)
                    }
                    skippedFileCount += 1
                    status = 'already exists'
                }
                else {
                    await client.send(new CopyObjectCommand({
                        ACL: 'public-read',
                        Bucket: bucket,
                        CopySource: copySource(bucket, object.Key),
                        Key: destinationKey,
                    }))
                    copiedFileCount += 1
                    status = 'copied'
                }
            }
            catch (exception) {
                failedFileCount += 1
                failure = exception
                status = 'failed'
            }
            processedFileCount += 1
            const percentage = Math.floor(
                processedFileCount / totalFileCount * 100
            )
            const progress = `[${processedFileCount}/${totalFileCount} ${percentage}%]`
            if (status === 'copied') {
                console.info(`${progress} ✅ ${object.Key} -> ${destinationKey}`)
            }
            else if (status === 'already exists') {
                console.info(`${progress} ↷ ${destinationKey} already exists`)
            }
            else {
                console.error(`${progress} ❌ ${object.Key} -> ${destinationKey}`)
                console.error(failure)
            }
        })
        continuationToken = response.IsTruncated
            ?
            response.NextContinuationToken
            :
            undefined
    } while (continuationToken)
    if (dryRun) {
        console.info(`Dry run completed: ${processedFileCount} files mapped.`)
        return
    }
    console.info(`Copy completed: ${copiedFileCount} copied, ${skippedFileCount} already existed, ${failedFileCount} failed.`)
    if (failedFileCount > 0) {
        process.exitCode = 1
    }
}

const selectTarget = async (reader, legacyPath) => {
    console.info(`Multiple destinations found for ${legacyPath.path}:`)
    legacyPath.targets.forEach((target, index) => {
        console.info(`${index + 1}. ${target}`)
    })
    console.info('0. Skip')
    while (true) {
        const answer = await reader.question('Select destination: ')
        const selectedIndex = Number.parseInt(answer, 10)
        if (selectedIndex === 0) {
            return
        }
        if (selectedIndex > 0 && selectedIndex <= legacyPath.targets.length) {
            return legacyPath.targets[selectedIndex - 1]
        }
        console.info('Enter one of the listed numbers.')
    }
}

const copyLegacyPaths = async params => {
    const {
        args,
        bucket,
        client,
        discovery,
        reader,
    } = params
    const selectedTypes = args.type
        ?
        args.type
            .split(',')
            .map(type => type.trim().toLowerCase())
            .filter(Boolean)
        :
        []
    if (args.type !== undefined && selectedTypes.length === 0) {
        throw new Error('Type must contain at least one value.')
    }
    const selectedTypeSet = new Set(selectedTypes)
    const legacyPaths = selectedTypes.length > 0
        ?
        discovery.legacyPaths.filter(item =>
            selectedTypeSet.has(getPathName(item.path).toLowerCase())
        )
        :
        discovery.legacyPaths
    const foundTypes = new Set(
        legacyPaths.map(item => getPathName(item.path).toLowerCase())
    )
    const missingTypes = selectedTypes.filter(type => !foundTypes.has(type))
    if (missingTypes.length > 0) {
        throw new Error(`Legacy paths were not found for types: ${missingTypes.join(', ')}`)
    }
    const concurrency = Number.parseInt(args.concurrency || '5', 10)
    if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new Error('Concurrency must be a positive integer.')
    }
    const dryRun = args.dryRun === 'true'
    for (const legacyPath of legacyPaths) {
        let targets = legacyPath.targets
        if (args.part && selectedTypes.length > 0) {
            targets = targets.filter(target =>
                target.split('/')[0].toLowerCase() === args.part.trim().toLowerCase()
            )
            if (targets.length === 0) {
                throw new Error(`Part ${args.part} is not a destination for ${getPathName(legacyPath.path)}. Choose one of: ${legacyPath.targets.join(', ')}`)
            }
        }
        const destinationPrefix = targets.length === 1
            ?
            targets[0]
            :
            await selectTarget(reader, {
                ...legacyPath,
                targets,
            })
        if (!destinationPrefix) {
            console.info(`Skipped ${legacyPath.path}`)
            continue
        }
        console.info(`Copying ${legacyPath.path} to ${destinationPrefix} with concurrency ${concurrency}`)
        await copyLegacyPath({
            bucket,
            client,
            concurrency,
            destinationPrefix,
            dryRun,
            sourcePrefix: legacyPath.path,
            totalFileCount: legacyPath.fileCount,
        })
    }
}

const discover = async () => {
    const args = parseArguments()
    const repo = args.repo || process.env.repo || process.env.apiRepo
    if (!repo) {
        throw new Error('Runnable repository is required. Pass repo=repoName.')
    }
    const settings = getSettings(repo)
    const aws = settings.migrateToFqnOnCloudStorage?.aws || {}
    if (
        !aws.accessKey ||
        !aws.bucket ||
        !aws.secretKey ||
        !aws.serviceUrl
    ) {
        throw new Error('AWS serviceUrl, bucket, accessKey, and secretKey are required.')
    }
    const client = new S3Client({
        credentials: {
            accessKeyId: aws.accessKey,
            secretAccessKey: aws.secretKey,
        },
        endpoint: String(aws.serviceUrl).replace(/\/$/, ''),
        forcePathStyle: true,
        maxAttempts: 3,
        region: aws.region || 'default',
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 10000,
            requestTimeout: 30000,
            socketTimeout: 30000,
        }),
    })
    const reader = createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    try {
        const {
            partsByName,
            partsByType,
        } = await getPartDefinitions(repo)
        console.info(`Connecting to ${aws.serviceUrl}/${aws.bucket}`)
        const discovery = await discoverPaths({
            bucket: aws.bucket,
            client,
            partsByName,
            partsByType,
        })
        printDiscovery(discovery)
        await copyLegacyPaths({
            args,
            bucket: aws.bucket,
            client,
            discovery,
            reader,
        })
    }
    finally {
        reader.close()
        client.destroy()
    }
}

await discover()
