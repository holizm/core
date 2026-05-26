export const getStack = () => {
    const stack = new Error()
        .stack
        .split('\n')
        .filter(i => !/^.*(\.vite|keycloak|\.main\.jsx).*/.test(i))
    return stack
}



const sortObject = value => {
    if (Array.isArray(value)) {
        return value.map(sortObject)
    }

    if (
        value &&
        typeof value === 'object' &&
        !(value instanceof Error)
    ) {
        return Object.keys(value)
            .sort()
            .reduce((out, key) => {
                out[key] = sortObject(value[key])
                return out
            }, {})
    }

    return value
}

const stringify = value => {
    try {
        return JSON.stringify(
            sortObject(value),
            null,
            4
        )
    } catch {
        return '[Circular]'
    }
}

const formatError = error => {
    const { name = 'Error', message = '', stack = '', ...rest } = error
    const stackLines = stack.split('\n')
    stackLines[0] = `${name}: ${message}`
    let out = stackLines.join('\n')
    const extraKeys = Object.keys(rest)
    if (extraKeys.length > 0) {
        const extras = {}
        for (const key of extraKeys) {
            extras[key] = rest[key]
        }
        out += `\nExtra: ${stringify(extras, null, 4)}`
    }
    return out
}

const log = (color, toStderr, ...args) => {
    const stack = getStack()
    const colorCodeStart = color
    const colorCodeReset = '\x1b[0m'
    const message = args.map(arg => {
        if (arg instanceof Error) {
            return formatError(arg)
        } else if (typeof arg === 'object') {
            return stringify(arg, null, 4)
        } else {
            return String(arg)
        }
    }).join(' ')

    const output = `${colorCodeStart}${message}${colorCodeReset}`
    if (toStderr) {
        console.error(output)
    } else {
        console.log(output)
    }
}

export const success = (...args) => {
    log('\x1b[32m', false, ...args)
}

export const info = (...args) => {
    log('\x1b[36m', false, ...args)
}

export const warning = (...args) => {
    log('\x1b[33m', false, ...args)
}

export const error = (...args) => {
    log('\x1b[31m', true, ...args)
}

export const errorAndExit = (...args) => {
    dividedError(...args)
    process.exit(1)
}

export const check = (...args) => {
    const checkMark = '\u2714'
    log('\x1b[32m', false, ...args, checkMark)
}

export const divide = (toStderr) => {
    const func = toStderr ? console.error : console.log
    func()
    func('\x1b[35m----------\x1b[0m')
    func()
}

export const dividedError = (...args) => {
    divide(true)
    error(...args)
    divide(true)
}
