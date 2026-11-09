export default params => globalThis.mockSetupLocalDns(params)

export const lookup = domain => globalThis.mockRunnableDnsLookup(domain)
