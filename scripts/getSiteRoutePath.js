const sharedRouteRoots = new Set([
    'dashboard',
])

export default ({
    dependency,
    relative,
}) => {
    const [root] = relative.split('/')
    const isSharedRoute = sharedRouteRoots.has(root)
    const routeSegments = isSharedRoute
        ?
        relative.split('/')
        :
        [
            dependency,
            ...relative.split('/'),
        ]
    const routePath = routeSegments.filter(Boolean).join('/')
    const route = {
        isSharedRoute,
        routePath,
    }
    return route
}
