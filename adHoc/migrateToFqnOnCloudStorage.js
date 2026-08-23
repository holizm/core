import {
    existsSync,
    readFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import {
    basename,
    dirname,
    join,
    resolve,
} from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import camelCase from 'lodash.camelcase'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const home = resolve(currentDirectory, '../..')
const apiRequire = createRequire(join(home, 'api/package.json'))
const {
    CopyObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    S3Client,
} = apiRequire('@aws-sdk/client-s3')

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
    if (!filePath || !existsSync(filePath)) {
        return {}
    }
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
    const dependenciesPath = join(home, repo, 'common/dependencies')
    const essentialPartsPath = join(home, 'core/essentialParts')
    const partFiles = new Set()
    for (const filePath of [
        dependenciesPath,
        essentialPartsPath,
    ]) {
        if (!existsSync(filePath)) {
            continue
        }
        for (const line of readFileSync(filePath, 'utf8').split('\n')) {
            const part = line.trim()
            if (part) {
                const partFile = join(home, part, 'part')
                if (existsSync(partFile)) {
                    partFiles.add(partFile)
                }
            }
        }
    }
    const nichePartFiles = await fg(`${home}/${repo}/**/part`, {
        onlyFiles: true,
    })
    for (const partFile of nichePartFiles) {
        partFiles.add(partFile)
    }
    return [...partFiles]
}

const getPartsByType = async repo => {
    const partsByType = new Map()
    const partFiles = await getPartFiles(repo)
    for (const partFile of partFiles) {
        const part = basename(dirname(partFile))
        const lines = readFileSync(partFile, 'utf8').split('\n')
        for (const line of lines) {
            if (!line || /^\s/.test(line)) {
                continue
            }
            const type = line.trim().split(/\s+/)[0]
            const normalizedType = type.toLowerCase()
            const candidates = partsByType.get(normalizedType) || []
            candidates.push({
                part,
                type,
            })
            partsByType.set(normalizedType, candidates)
        }
    }
    return partsByType
}

const listDirectories = async (client, bucket) => {
    const directories = []
    let continuationToken
    do {
        const response = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            Delimiter: '/',
        }))
        for (const prefix of response.CommonPrefixes || []) {
            directories.push(prefix.Prefix.replace(/\/$/, ''))
        }
        if (response.IsTruncated) {
            continuationToken = response.NextContinuationToken
        }
        else {
            continuationToken = undefined
        }
    } while (continuationToken)
    return directories
}

const listLegacyFiles = async (client, bucket, type) => {
    const files = []
    let continuationToken
    do {
        const response = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            Delimiter: '/',
            Prefix: `${type}/`,
        }))
        for (const object of response.Contents || []) {
            if (object.Key !== `${type}/`) {
                files.push(object)
            }
        }
        if (response.IsTruncated) {
            continuationToken = response.NextContinuationToken
        }
        else {
            continuationToken = undefined
        }
    } while (continuationToken)
    return files
}

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

const copySource = (bucket, key) => encodeURIComponent(`${bucket}/${key}`)
    .replaceAll('%2F', '/')

const copyFile = async params => {
    const {
        bucket,
        client,
        destinationKey,
        source,
    } = params
    console.info(`Checking destination ${destinationKey}`)
    const destination = await getObject(client, bucket, destinationKey)
    if (destination) {
        if (
            destination.ContentLength !== source.Size ||
            destination.ETag !== source.ETag
        ) {
            throw new Error(`Destination already exists with different content: ${destinationKey}`)
        }
        console.info(`Verified existing destination ${destinationKey}`)
    }
    else {
        console.info(`Copying ${source.Key} to ${destinationKey}`)
        await client.send(new CopyObjectCommand({
            ACL: 'public-read',
            Bucket: bucket,
            CopySource: copySource(bucket, source.Key),
            Key: destinationKey,
        }))
        const copiedObject = await getObject(client, bucket, destinationKey)
        if (!copiedObject || copiedObject.ContentLength !== source.Size) {
            throw new Error(`Copied object verification failed: ${destinationKey}`)
        }
        console.info(`Verified copied destination ${destinationKey}`)
    }
}

const selectCandidate = async (reader, type, candidates) => {
    console.info(`Multiple destinations found for ${type}:`)
    candidates.forEach((candidate, index) => {
        console.info(`${index + 1}. ${candidate.part}/${candidate.type}`)
    })
    console.info('0. Skip')
    while (true) {
        const answer = await reader.question(`Select destination for ${type}: `)
        const selectedIndex = Number.parseInt(answer, 10)
        if (selectedIndex === 0) {
            return
        }
        if (selectedIndex > 0 && selectedIndex <= candidates.length) {
            return candidates[selectedIndex - 1]
        }
    }
}

const migrate = async () => {
    const args = parseArguments()
    const repo = args.repo || process.env.repo || process.env.apiRepo
    if (!repo) {
        throw new Error('Runnable repository is required. Pass repo=repoName.')
    }
    const settings = getSettings(repo)
    const aws = settings.migrateToFqnOnCloudStorage?.aws || {}
    const dryRun = args.dryRun === 'true'
    if (
        !aws.serviceUrl ||
        !aws.bucket ||
        !aws.accessKey ||
        !aws.secretKey
    ) {
        throw new Error('AWS serviceUrl, bucket, accessKey, and secretKey are required.')
    }
    console.info(`Loaded migration secrets for ${repo}`)
    console.info(`Storage endpoint: ${aws.serviceUrl}`)
    console.info(`Storage bucket: ${aws.bucket}`)
    console.info(`Dry run: ${dryRun}`)
    const client = new S3Client({
        credentials: {
            accessKeyId: aws.accessKey,
            secretAccessKey: aws.secretKey,
        },
        endpoint: String(aws.serviceUrl).replace(/\/$/, ''),
        forcePathStyle: true,
        region: aws.region || 'default',
    })
    const partsByType = await getPartsByType(repo)
    console.info(`Loaded ${partsByType.size} type mappings for ${repo}`)
    console.info('Connecting to cloud storage and listing containers')
    let directories
    try {
        directories = await listDirectories(client, aws.bucket)
    }
    catch (exception) {
        console.error(`Cloud storage connection failed for ${aws.serviceUrl}/${aws.bucket}`)
        throw exception
    }
    console.info(`Connected to cloud storage successfully`)
    console.info(`Found ${directories.length} containers: ${directories.join(', ') || 'none'}`)
    if (args.containers) {
        const requestedContainers = new Set(
            args.containers
                .split(',')
                .map(container => container.trim().toLowerCase())
                .filter(Boolean)
        )
        const availableContainers = new Set(
            directories.map(directory => directory.toLowerCase())
        )
        const missingContainers = [...requestedContainers].filter(container =>
            !availableContainers.has(container)
        )
        if (missingContainers.length > 0) {
            throw new Error(`Storage containers do not exist: ${missingContainers.join(', ')}`)
        }
        directories = directories.filter(directory =>
            requestedContainers.has(directory.toLowerCase())
        )
        console.info(`Selected containers: ${directories.join(', ')}`)
    }
    let reader
    let failedFiles = 0
    let copiedFiles = 0
    let plannedFiles = 0
    try {
        for (const directory of directories) {
            if (directory.toLowerCase() === 'filemanager') {
                console.info('Skipping filemanager exception')
                continue
            }
            const candidates = partsByType.get(directory.toLowerCase()) || []
            if (candidates.length === 0) {
                console.info(`No part found for storage directory ${directory}. Skipping.`)
                continue
            }
            const files = await listLegacyFiles(
                client,
                aws.bucket,
                directory
            )
            if (files.length === 0) {
                console.info(`No legacy files found directly in ${directory}`)
                continue
            }
            let candidate = candidates[0]
            if (candidates.length > 1) {
                reader ||= createInterface({
                    input: process.stdin,
                    output: process.stdout,
                })
                candidate = await selectCandidate(reader, directory, candidates)
                if (!candidate) {
                    console.info(`Skipped ${directory}`)
                    continue
                }
            }
            console.info(`Mapped ${directory} to ${candidate.part}/${candidate.type}`)
            console.info(`Found ${files.length} legacy files in ${directory}`)
            for (const [index, source] of files.entries()) {
                const destinationKey = `${candidate.part.toLowerCase()}/${candidate.type}/${basename(source.Key)}`
                plannedFiles += 1
                console.info(`Processing ${index + 1}/${files.length}: ${source.Key}`)
                if (dryRun) {
                    console.info(`Would copy ${source.Key} to ${destinationKey}`)
                    continue
                }
                try {
                    await copyFile({
                        bucket: aws.bucket,
                        client,
                        destinationKey,
                        source,
                    })
                    copiedFiles += 1
                    console.info(`Copied ${source.Key} to ${destinationKey}`)
                }
                catch (exception) {
                    failedFiles += 1
                    console.error(`Failed to copy ${source.Key} to ${destinationKey}`)
                    console.error(exception)
                }
            }
        }
    }
    finally {
        reader?.close()
        client.destroy()
    }
    if (dryRun) {
        console.info(`Dry run completed. ${plannedFiles} files would be copied.`)
    }
    else {
        console.info(`Migration completed. ${copiedFiles} files copied and ${failedFiles} files failed.`)
        if (failedFiles > 0) {
            process.exitCode = 1
        }
    }
}

await migrate()
