Running as non-root is necessary, but several higher-priority issues exist.

  Critical findings:

  1. Secrets are committed directly in Compose files:
      - core/container/composes/accounts:12
      - core/container/composes/database:11
      - core/container/composes/search:9
      - core/container/composes/site:18

     The site additionally mounts secrets.json inside a public directory at core/container/composes/site:70, which risks exposing it through the web server.
     These credentials should be rotated and supplied through Compose secrets or your deployment secret store. Compose secrets are mounted read-only and granted
     explicitly per service. Docker secrets documentation

  2. TLS verification is disabled globally for the site through NODE_TLS_REJECT_UNAUTHORIZED=0 at core/container/composes/site:11. This permits man-in-the-
     middle attacks and should never reach production.

  3. MongoDB and the accounts PostgreSQL database publish ports on every host interface:
      - MongoDB (core/container/composes/database:14)
      - PostgreSQL (core/container/composes/accounts:39)

     Unless external database access is required, remove these published ports. Containers can communicate through their Docker network.

  4. The site uses host networking at core/container/composes/site:102. This removes Docker’s network isolation and should be replaced with an ordinary isolated
     network. Docker explicitly identifies host networking and bind mounts as sensitive Compose capabilities. Docker Compose trust model

  5. The production panel runs as root because its runner stage has no USER instruction at core/container/files/prod/panel:13. The production API correctly
     switches to node. Development images inherit dev, although ${userLine} only explicitly sets a UID during CI.

  Important hardening after those fixes:

  - Add security_opt: [no-new-privileges:true].
  - Drop Linux capabilities with cap_drop: [ALL], adding back only demonstrated requirements.
  - Use read_only: true for production services, with explicit writable volumes or tmpfs.
  - Add pids_limit, memory, and CPU limits to reduce denial-of-service impact.
  - Mount configuration and secrets read-only.
  - Remove chmod 777 from production panel (core/container/files/prod/panel:10).
  - Replace latest and mutable base-image tags with controlled versions or digests. Docker recommends digest pinning for reproducible, auditable builds. Docker
    build guidance

  - Stop downloading and executing an unverified script through curl | bash at development core (core/container/files/dev/core:15).
  - Run the API process directly as PID 1 instead of backgrounding it and keeping the container alive with tail -f /dev/null at production API (core/container/
    files/prod/api:25).

  - Restore database logging; driver: none at core/container/composes/database:16 prevents useful security auditing.
  - Scan built images and dependencies regularly.
  - Consider Docker rootless mode or daemon-level user namespace remapping for host protection. Docker rootless mode

  For your scale, I would implement these incrementally, beginning with removing and rotating committed secrets.
