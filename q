[1mdiff --git a/.github/workflows/builder.yaml b/.github/workflows/builder.yaml[m
[1mindex 8ee4c48..7047b7c 100644[m
[1m--- a/.github/workflows/builder.yaml[m
[1m+++ b/.github/workflows/builder.yaml[m
[36m@@ -1,38 +1,50 @@[m
 name: builder[m
 [m
 on:[m
[31m-  workflow_call:[m
[31m-    inputs:[m
[31m-      file:[m
[31m-        required: true[m
[31m-        type: string[m
[31m-      dir:[m
[31m-        type: string[m
[31m-        default: dev[m
[31m-      tag:[m
[31m-        required: false[m
[31m-        type: string[m
[31m-        [m
[32m+[m[32m    workflow_call:[m
[32m+[m[32m        inputs:[m
[32m+[m[32m            file:[m
[32m+[m[32m                required: true[m
[32m+[m[32m                type: string[m
[32m+[m[32m            dir:[m
[32m+[m[32m                type: string[m
[32m+[m[32m                default: dev[m
[32m+[m[32m            tag:[m
[32m+[m[32m                required: false[m
[32m+[m[32m                type: string[m
[32m+[m
[32m+[m[32menv:[m
[32m+[m[32m    GH_TOKEN: ${{ secrets.PAT }}[m
[32m+[m
 jobs:[m
[31m-  build-and-push:[m
[31m-    runs-on: ubuntu-latest[m
[31m-    steps:[m
[31m-      - name: Checkout repository[m
[31m-        uses: actions/checkout@v5[m
[32m+[m[32m    build-and-push:[m
[32m+[m[32m        runs-on: ubuntu-latest[m
[32m+[m[32m        steps:[m
[32m+[m[32m            - name: Initialize[m
[32m+[m[32m              if: startsWith(runner.name, 'GitHub')[m
[32m+[m[32m              run: |[m
[32m+[m[32m                  echo "~/core/commands" >> $GITHUB_PATH[m
[32m+[m[32m                  mkdir ~/secrets[m
[32m+[m[32m                  mkdir -p ~/.ssh[m
[32m+[m[32m                  echo "${{ secrets.SSH }}" > ~/.ssh/id_ed25519[m
[32m+[m[32m                  chmod --preserve-root 400 ~/.ssh/id_ed25519[m
[32m+[m[32m                  cd ~[m
[32m+[m[32m                  git clone git@github.com:holizm/core[m
[32m+[m[32m                  git clone git@github.com:holizm/phoneCode[m
 [m
[31m-      - name: Set up Docker Buildx[m
[31m-        uses: docker/setup-buildx-action@v3[m
[32m+[m[32m            - name: Set up Docker Buildx[m
[32m+[m[32m              uses: docker/setup-buildx-action@v3[m
 [m
[31m-      - name: Log in to Docker Hub[m
[31m-        run: echo ${{ secrets.DOCKER_ACCESS_TOKEN }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin[m
[32m+[m[32m            - name: Log in to Docker Hub[m
[32m+[m[32m              run: echo ${{ secrets.DOCKER_ACCESS_TOKEN }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin[m
 [m
[31m-      - name: Build and push Docker image[m
[31m-        uses: docker/build-push-action@v5[m
[31m-        with:[m
[31m-          context: ./container/files/${{ inputs.dir }}[m
[31m-          file: ./container/files/${{ inputs.dir }}/${{ inputs.file }}[m
[31m-          push: true[m
[31m-          tags: ${{ secrets.DOCKER_USERNAME }}/${{ inputs.tag || inputs.file }}:latest[m
[32m+[m[32m            - name: Build and push Docker image[m
[32m+[m[32m              uses: docker/build-push-action@v5[m
[32m+[m[32m              with:[m
[32m+[m[32m                  context: $HOME[m
[32m+[m[32m                  file: ./core/container/files/${{ inputs.dir }}/${{ inputs.file }}[m
[32m+[m[32m                  push: true[m
[32m+[m[32m                  tags: ${{ secrets.DOCKER_USERNAME }}/${{ inputs.tag || inputs.file }}:latest[m
 [m
[31m-      - name: Log out from Docker Hub[m
[31m-        run: docker logout[m
[32m+[m[32m            - name: Log out from Docker Hub[m
[32m+[m[32m              run: docker logout[m
[1mdiff --git a/container/files/prod/accounts b/container/files/prod/accounts[m
[1mindex e80c265..8417235 100644[m
[1m--- a/container/files/prod/accounts[m
[1m+++ b/container/files/prod/accounts[m
[36m@@ -1,5 +1,7 @@[m
 FROM quay.io/keycloak/keycloak:latest AS builder[m
 [m
[32m+[m[32mCOPY ./phoneCode/target/phone-code-provider.jar /opt/keycloak/providers/[m
[32m+[m
 WORKDIR /opt/keycloak[m
 [m
 RUN /opt/keycloak/bin/kc.sh build --db=postgres[m
