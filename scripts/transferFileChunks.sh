#!/usr/bin/env bash
set -euo pipefail
. "$HOME/core/scripts/logger.sh"

sourcePath=$1
domain=$2
destinationPath=$3
chunkBytes=${transferChunkBytes:-262144}
[[ "$chunkBytes" =~ ^[1-9][0-9]{0,8}$ ]] || exit 1
if [[ "$(stat -c %s -- "$sourcePath")" -le "$chunkBytes" ]]; then
    transferMode=complete "$HOME/core/commands/serverCopy" "$sourcePath" "$domain:$destinationPath"
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
printf -v quotedPieces '%q' "$remoteDirectory/${directory##*/}"
printf -v quotedArchive '%q' "$remoteDirectory/${directory##*/}/archive"
printf -v quotedDestination '%q' "$destinationPath"
transferMode=complete "$HOME/core/commands/serverCopy" "$directory" "$domain:$remoteDirectory"
command="cat $quotedPieces/chunk* > $quotedArchive && printf '%s  %s\\n' '$archiveDigest' $quotedArchive | sha256sum --check --status && mv -- $quotedArchive $quotedDestination"
"$HOME/core/commands/connect" "$domain" "$command"
