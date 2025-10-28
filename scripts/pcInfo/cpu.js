import { execSync } from 'child_process'
import { info, check, error } from '../../scripts/logger.js'

function run(cmd) {
    try {
        return execSync(cmd).toString().trim()
    } catch {
        return ''
    }
}

export default () => {
    const cpuCores = parseInt(run('nproc')) || 0
    const desirableCoresCount = 4

    if (cpuCores >= desirableCoresCount)
        check(`CPU Cores: ${cpuCores}`)
    else
        error(`You only have ${cpuCores} cores in your CPU. We need at least ${desirableCoresCount} cores`)

    let clockSpeedMHz = run("lscpu | awk -F: '/^CPU MHz/ { print $2 }' | xargs")
    if (!clockSpeedMHz)
        clockSpeedMHz = run("awk -F: '/^cpu MHz/ { print $2; exit }' /proc/cpuinfo | xargs")

    if (/^[0-9]+(\.[0-9]+)?$/.test(clockSpeedMHz)) {
        const clockSpeedGHz = (parseFloat(clockSpeedMHz) / 1000).toFixed(2)
        check(`Clock Speed: ${clockSpeedGHz} GHz`)
    } else {
        error('Could not determine clock speed')
    }

    const vendor = run("lscpu | awk -F: '/^Vendor ID/ { print $2 }' | xargs") || 'Unknown'
    const modelName = run("lscpu | awk -F: '/^Model name/ { print $2 }' | xargs") || 'Unknown'

    // Extract generation from model number
    const genMatch = modelName.match(/i[3579]-(\d{3,4})[A-Z]*/i)
    const modelNumber = genMatch ? parseInt(genMatch[1]) : 0

    let generation = 'Unknown'
    let year = 'Unknown'

    if (modelNumber >= 1000 && modelNumber < 2000) { generation = '1st'; year = '~2008–2010' }
    else if (modelNumber >= 2000 && modelNumber < 3000) { generation = '2nd'; year = '~2011–2012' }
    else if (modelNumber >= 3000 && modelNumber < 4000) { generation = '3rd'; year = '~2012–2013' }
    else if (modelNumber >= 4000 && modelNumber < 5000) { generation = '4th'; year = '~2013–2014' }
    else if (modelNumber >= 5000 && modelNumber < 6000) { generation = '5th'; year = '~2015' }
    else if (modelNumber >= 6000 && modelNumber < 7000) { generation = '6th'; year = '~2015–2016' }
    else if (modelNumber >= 7000 && modelNumber < 8000) { generation = '7th'; year = '~2016–2017' }
    else if (modelNumber >= 8000 && modelNumber < 9000) { generation = '8th'; year = '~2017–2018' }
    else if (modelNumber >= 9000 && modelNumber < 10000) { generation = '9th'; year = '~2018–2019' }
    else if (modelNumber >= 10000 && modelNumber < 11000) { generation = '10th'; year = '~2019–2020' }
    else if (modelNumber >= 11000 && modelNumber < 12000) { generation = '11th'; year = '~2020–2021' }
    else if (modelNumber >= 12000 && modelNumber < 13000) { generation = '12th'; year = '~2021–2022' }

    check(`CPU Vendor: ${vendor}`)
    check(`CPU Model: ${modelName}`)
    check(`Likely Generation: ${generation}`)
    check(`Estimated Release Year: ${year}`)
}
