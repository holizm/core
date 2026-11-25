import { join } from 'path'
import isDir from './isDir.js'
import {
    getContent,
    getFiles,
} from './os.js'

export default directory => {
    const folders = {
        brand: 'brands',
        callToAction: 'callToActions',
        cards: 'cardCollections',
        copyright: 'copyrights',
        dataSection: 'dataSections',
        description: 'descriptions',
        heading: 'headings',
        icon: 'icons',
        image: 'images',
        label: 'labels',
        link: 'links',
        links: 'linkCollections',
        location: 'locations',
        logos: 'logos',
        menus: 'menuItems',
        quote: 'quotes',
        slider: 'sliders',
        slogan: 'slogans',
        stat: 'stats',
        title: 'titles',
        url: 'urls',
    }
    const samples = Object.fromEntries(Object.entries(folders).map(([type, folder]) => {
        const path = join(directory, folder)
        const entries = isDir(path) ? getFiles(path)
            .filter(file => file.endsWith('.json'))
            .sort()
            .map(file => JSON.parse(getContent(join(path, file)))) : []
        return [type, entries]
    }))
    return samples
}
