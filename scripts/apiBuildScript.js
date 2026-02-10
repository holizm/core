import { info } from './logger.js'
import { runOnTerminal } from './terminal.js'
import { copyFileIfNotExists } from './os.js'

const copyBase = params => {
    const {
        home,
        apiPackagePath,
    } = params
    info('Copying core...')
    copyFileIfNotExists(`${apiPackagePath}`,)
}
/*
#!/bin/bash

function CopyBase()
{
    echo 'Copying base ...'

    cp /HolismHolding/NodeApi/package.json $ProcessPath/package.json
    cp /HolismHolding/NodeApi/package-lock.json $ProcessPath/package-lock.json
    cp -r /HolismHolding/NodeApi/Core /npm/node_modules
    cp /HolismHolding/Infra/NodeApi/Package /npm/node_modules/Core/package.json
}

function CopyDependencies()
{
    echo 'Copying dependencies ...'
    while read Dependency;
    do
        DependencyOrgOrRep=HolismHolding
        RunnableModule=false
        if [ -d /$Repository/$Dependency ]; then
            DependencyOrgOrRep=$Repository
            RunnableModule=true
        fi
        DependencyBase=/$DependencyOrgOrRep/$Dependency/Api
        if [ ! -f /$DependencyOrgOrRep/$Dependency/Part ]; then
            continue;
        fi
        mkdir -p /npm/node_modules/$Dependency/Api
        if [[ -d $DependencyBase/Api/Common ]]; then
            cp -r $DependencyBase/Api/Common /npm/node_modules/$Dependency/Api/Common
        fi
        cp /$DependencyOrgOrRep/$Dependency/Part /npm/node_modules/$Dependency
        cp /HolismHolding/Infra/NodeApi/Package /npm/node_modules/$Dependency/package.json
        cp -r $DependencyBase/Business /npm/node_modules/$Dependency/Business

        if [[ $Process == *Admin* ]]; then
            cp -r $DependencyBase/Api/Admin /npm/node_modules/$Dependency/Api/Role
        fi
        if [[ $Process == *Site* ]]; then
            cp -r $DependencyBase/Api/Site /npm/node_modules/$Dependency/Api/Role
        fi
        ln -s -f /npm/node_modules/$Dependency $ProcessPath

    done <<< '$({ cat $DependenciesPath; echo; })'
}

function CopyRunnable()
{
    if [ -d /$Repository/Common/Api ]; then
        cp -r /$Repository/Common/Api $ProcessPath/CommonApi
    fi
}

ln -s -f /npm/node_modules ${ProcessPath}
CopyBase
CopyDependencies
CopyRunnable

cd $ProcessPath
find $ProcessPath

Directories=$(find /npm/node_modules -maxdepth 1 -mindepth 1 -type d -name '[A-Z]*')
node /HolismHolding/Commands/ApiContainer/GenerateExports.mjs $Directories

rm -rf /Repository/Common/ConnectionStrings.json
rm -rf /Repository/Common/Settings.json
rm -rf $ProcessPath/SettingsOverride.json

*/
