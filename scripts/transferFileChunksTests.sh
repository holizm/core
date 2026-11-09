#!/usr/bin/env bash
set -euo pipefail

directory=$(mktemp -d /tmp/transferFileChunksTestsXXXXXX)
trap 'rm -r -- "$directory"' EXIT
export transferTestDirectories="$directory/directories"
mkdir "$directory/bin"
cat > "$directory/bin/node" <<'script'
#!/usr/bin/env bash
printf '%s\n' '22 fixtureUser 127.0.0.1'
script
cat > "$directory/bin/ssh" <<'script'
#!/usr/bin/env bash
command=${@: -1}
if [[ "$command" == 'mktemp -d /tmp/serverTransferXXXXXX' ]]; then
    path=$(bash -c "$command")
    printf '%s\n' "$path" >> "$transferTestDirectories"
    printf '%s\n' "$path"
else
    bash -c "$command"
fi
script
cat > "$directory/bin/scp" <<'script'
#!/usr/bin/env bash
sourcePath=${@: -2:1}
destinationPath=${@: -1}
if [[ -n "${transferHangMarker:-}" ]]; then
    printf '%s\n' "$BASHPID" >> "$transferHangMarker"
    trap '' TERM
    sleep 30
fi
targetPath=${destinationPath#*:}
if [[ -d "$targetPath" ]]; then targetPath="$targetPath/${sourcePath##*/}"; fi
if [[ -n "${transferFailChunk:-}" && "${sourcePath##*/}" == "$transferFailChunk" ]]; then exit 1; fi
if [[ -n "${transferRetryMarker:-}" && "${sourcePath##*/}" == chunk00000001 && ! -e "$transferRetryMarker" ]]; then
    : > "$transferRetryMarker"
    exit 1
fi
if [[ -n "${transferCorruptChunk:-}" && "${sourcePath##*/}" == "$transferCorruptChunk" ]]; then
    printf '%s' corrupted > "$targetPath"
else
    cp -- "$sourcePath" "$targetPath"
fi
script
chmod +x "$directory/bin/node" "$directory/bin/ssh" "$directory/bin/scp"
export PATH="$directory/bin:$PATH"
export transferChunkBytes=3
printf '%s' ABCDEFGHIJ > "$directory/payload"
bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"
cmp -- "$directory/payload" "$directory/resultArchive"
while read -r path; do test ! -e "$path"; done < "$transferTestDirectories"
export transferFailChunk=chunk00000001
if bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"; then exit 1; fi
cmp -- "$directory/payload" "$directory/resultArchive"
while read -r path; do test ! -e "$path"; done < "$transferTestDirectories"
unset transferFailChunk
export transferCorruptChunk=chunk00000001
if bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"; then exit 1; fi
cmp -- "$directory/payload" "$directory/resultArchive"
while read -r path; do test ! -e "$path"; done < "$transferTestDirectories"
unset transferCorruptChunk
export transferRetryMarker="$directory/retried"
printf '%s' 0123456789 > "$directory/payload"
bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"
test -f "$transferRetryMarker"
cmp -- "$directory/payload" "$directory/resultArchive"
while read -r path; do test ! -e "$path"; done < "$transferTestDirectories"
if transferChunkBytes=0 bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"; then exit 1; fi
export transferHangMarker="$directory/stalledProcesses"
if transferTimeoutSeconds=1 transferAttempts=1 bash "$HOME/core/scripts/transferFileChunks.sh" "$directory/payload" fixture "$directory/resultArchive"; then exit 1; fi
while read -r pid; do
    state=$(ps -o stat= -p "$pid" || true)
    if [[ -n "$state" && "$state" != Z* ]]; then exit 1; fi
done < "$transferHangMarker"
cmp -- "$directory/payload" "$directory/resultArchive"
printf '%s\n' 'Chunk integrity, retry recovery, failure preservation, cleanup and bounded validation verified'
