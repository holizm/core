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

ensureLatestLts() {
    local commandName="$1"
    local installedVersionProvider="$2"
    local latestVersionProvider="$3"
    local installerName="$4"
    local installedVersion
    local latestVersion
    local updatedVersion

    installedVersion=$("$installedVersionProvider")
    latestVersion=$("$latestVersionProvider")

    if [[ -z "$latestVersion" ]]; then
        errorAndExit "failed to resolve the latest $commandName LTS version"
    fi

    if [[ "$installedVersion" == "$latestVersion" ]]; then
        success "$commandName $installedVersion is the latest LTS $checkMark"
        return
    fi

    if [[ -n "$installedVersion" ]]; then
        info "updating $commandName from $installedVersion to LTS $latestVersion ..."
    else
        info "installing $commandName LTS $latestVersion ..."
    fi

    "$installerName" || errorAndExit "failed to install $commandName LTS $latestVersion"
    updatedVersion=$("$installedVersionProvider")

    if [[ "$updatedVersion" != "$latestVersion" ]]; then
        errorAndExit "$commandName LTS $latestVersion was requested, but $updatedVersion is installed"
    fi

    success "installed $commandName LTS $updatedVersion"
}
