fx_version 'cerulean'
games      { 'gta5' }
lua54      'yes'

author      'CharlesHacks#9999'
description '3D positional audio library for FiveM.'
version     '0.0.3'

shared_scripts {
    'config.lua',
}

server_scripts {
    'server/server.lua',
}

client_scripts {
    'client/client.lua',
}

ui_page 'nui/nui.html'

files {
    'nui/nui.html',
    'nui/app.js',
    'nui/lib/*.js',
    'sounds/**/*.ogg',
    'sounds/**/*.mp3',
}