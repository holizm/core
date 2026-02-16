#!/usr/bin/env bash
set -euo pipefail
homeDir=$(getent passwd "${SUDO_USER:-$USER}" | cut -d: -f6)

. "$homeDir/core/scripts/logger.sh"

install() {
    local commandName="$1"
    local packageOrFunction="${2:-}"

    if command -v "$commandName" &>/dev/null; then
        success "$commandName $checkMark"
        return
    fi

    info "installing $commandName ..."

    if [[ -n "$packageOrFunction" ]]; then
        if declare -f "$packageOrFunction" &>/dev/null; then
            "$packageOrFunction" || error "failed to install $commandName"
        else
            sudo apt-get install -y "$packageOrFunction" || error "failed to install $commandName"
        fi
    else
        sudo apt-get install -y "$commandName" || error "failed to install $commandName"
    fi

    success "installed $commandName"
}
