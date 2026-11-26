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
        card: 'cards',
        cards: 'cardCollections',
        copyright: 'copyrights',
        dataLoader: 'dataLoaders',
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
        scrollToTop: 'scrollToTopControls',
        slider: 'sliders',
        slogan: 'slogans',
        soundControl: 'soundControls',
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
