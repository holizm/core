#!/usr/bin/env bash
set -euo pipefail
homeDir=$(getent passwd "${SUDO_USER:-$USER}" | cut -d: -f6)

. "$homeDir/core/scripts/logger.sh"

install() {
    local cmd_name="$1"
    local pkg_or_func="${2:-}"

    if command -v "$cmd_name" &>/dev/null; then
        success "$cmd_name $check_mark"
        return
    fi

    info "installing $cmd_name ..."

    if [[ -n "$pkg_or_func" ]]; then
        if declare -f "$pkg_or_func" &>/dev/null; then
            "$pkg_or_func" || error "failed to install $cmd_name"
        else
            sudo apt-get install -y "$pkg_or_func" || error "failed to install $cmd_name"
        fi
    else
        sudo apt-get install -y "$cmd_name" || error "failed to install $cmd_name"
    fi

    success "installed $cmd_name"
}
