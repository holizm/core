import { join } from 'path'
import isDir from './isDir.js'
import isFile from './isFile.js'
import {
    getContent,
    getFiles,
} from './os.js'

export default directory => {
    const folders = {
        callToAction: 'callToActions',
        cards: 'cardCollections',
        dataSection: 'dataSections',
        description: 'descriptions',
        image: 'images',
        layout: 'layout',
        links: 'linkCollections',
        quote: 'quotes',
        slider: 'sliders',
        stat: 'stats',
        title: 'titles',
    }
    const samples = Object.fromEntries(Object.entries(folders).map(([type, folder]) => {
        const path = join(directory, folder)
        const entries = isDir(path) ? getFiles(path)
            .filter(file => file.endsWith('.json'))
            .sort()
            .map(file => JSON.parse(getContent(join(path, file)))) : []
        return [type, entries]
    }))
    const menuPath = join(directory, 'menuItems.json')
    samples.menuItems = isFile(menuPath) ? JSON.parse(getContent(menuPath)) : []
    return samples
}
