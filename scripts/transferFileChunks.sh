#!/usr/bin/env bash
set -euo pipefail
. "$HOME/core/scripts/logger.sh"

sourcePath=$1
domain=$2
destinationPath=$3
chunkBytes=${transferChunkBytes:-262144}
attemptLimit=${transferAttempts:-3}
timeoutSeconds=${transferTimeoutSeconds:-60}
[[ "$chunkBytes" =~ ^[1-9][0-9]{0,8}$ ]] || exit 1
[[ "$attemptLimit" =~ ^[1-9][0-9]?$ && "$timeoutSeconds" =~ ^[1-9][0-9]{0,3}$ ]] || exit 1
copyFile() {
    local copySourcePath=$1
    local copyDestinationPath=$2
    local attempt=0
    until timeout --kill-after=5 "$timeoutSeconds" bash -c '
        transferProcess=""
        trap '\''if [[ -n "$transferProcess" ]]; then kill -KILL -- "-$transferProcess" 2>/dev/null || true; fi; exit 124'\'' TERM
        setsid env transferMode=complete "$HOME/core/commands/serverCopy" "$1" "$2" &
        transferProcess=$!
        wait "$transferProcess"
    ' transfer "$copySourcePath" "$domain:$copyDestinationPath"; do
        attempt=$((attempt + 1))
        if [[ "$attempt" -ge "$attemptLimit" ]]; then return 1; fi
    done
}
if [[ "$(stat -c %s -- "$sourcePath")" -le "$chunkBytes" ]]; then
    copyFile "$sourcePath" "$destinationPath"
    exit $?
fi

directory=$(mktemp -d /tmp/serverTransferXXXXXX)
quotedRemoteDirectory=''
cleanupTransfer() {
    rm -r -- "$directory"
    if [[ -n "$quotedRemoteDirectory" ]]; then
        if ! "$HOME/core/commands/connect" "$domain" "rm -r -- $quotedRemoteDirectory" >/dev/null 2>&1; then
            warning "Could not remove transfer directory $remoteDirectory"
        fi
    fi
}
trap cleanupTransfer EXIT
split --bytes="$chunkBytes" --numeric-suffixes=0 --suffix-length=8 -- "$sourcePath" "$directory/chunk"
archiveDigest=$(sha256sum < "$sourcePath")
archiveDigest=${archiveDigest%% *}
remoteDirectory=$("$HOME/core/commands/connect" "$domain" 'mktemp -d /tmp/serverTransferXXXXXX')
[[ "$remoteDirectory" =~ ^/tmp/serverTransfer[a-zA-Z0-9]+$ ]] || exit 1
printf -v quotedRemoteDirectory '%q' "$remoteDirectory"
printf -v quotedPieces '%q' "$remoteDirectory"
printf -v quotedArchive '%q' "$remoteDirectory/archive"
printf -v quotedDestination '%q' "$destinationPath"
for chunk in "$directory"/chunk*; do copyFile "$chunk" "$remoteDirectory/${chunk##*/}"; done
command="cat $quotedPieces/chunk* > $quotedArchive && printf '%s  %s\\n' '$archiveDigest' $quotedArchive | sha256sum --check --status && mv -- $quotedArchive $quotedDestination"
"$HOME/core/commands/connect" "$domain" "$command"
