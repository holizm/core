import { runStreaming } from '../../scripts/terminal.js'
import run from './run'

const compare = part => runStreaming(`compare ${part}`)

const migrate = (command, part) => run({
    app: 'migration',
    command,
    part,
    show: true,
    skipAdHoc: true,
})

export default async part => {
    await migrate('newTypes', part)
    await compare(part)
    await migrate('newEnumItems', part)
    await compare(part)
    await migrate('indexes', part)
    await compare(part)
}
