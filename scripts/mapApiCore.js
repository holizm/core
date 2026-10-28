export default params => {
    const {
        containerHome,
        home,
        nodeModules,
        process,
        repo
    } = params;
    const coreItems = ['ai', 'api', 'application', 'cloud', 'core', 'data', 'extensions', 'settings', 'validation'];
    for (const coreItem of coreItems) {
        params.addVolume(`${home}/api/core/${coreItem}`, `${nodeModules}/core/${coreItem}`);
    }
    params.addVolume(`${home}/api`, `${containerHome}/api`);
    params.addVolume(`${home}/core/essentialParts`, `${nodeModules}/core/essentialParts`);
    params.addVolume(`${home}/${repo}/${process}/process.js`, `${containerHome}/${repo}/${process}/process.js`);
};
