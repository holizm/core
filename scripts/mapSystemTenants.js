export default params => {
    const {
        containerHome,
        home,
        process,
        repo,
    } = params
    const backingRepo = repo.replace(/Control$/, '')
    params.addVolume(`${home}/${backingRepo}/common/tenants`, `${containerHome}/${repo}/${process}/systemTenants`)
}
