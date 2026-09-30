export default {
    config: {
        'access.token.claim': 'true',
        'claim.name': 'roles',
        'id.token.claim': 'true',
        'introspection.token.claim': 'true',
        'jsonType.label': 'String',
        'lightweight.claim': 'true',
        multivalued: 'true',
        'userinfo.token.claim': 'true',
    },
    consentRequired: false,
    name: 'roles',
    protocol: 'openid-connect',
    protocolMapper: 'oidc-usermodel-realm-role-mapper',
}
