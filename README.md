# minecraft-mapper-js

Render a Minecraft map with three.js

[![Greenkeeper badge](https://badges.greenkeeper.io/Qazzian/minecraft-mapper-js.svg)](https://greenkeeper.io/)


## Description

This is still in early prototype stages.  
Uses a number of libraries from [prismarineJS](https://github.com/PrismarineJS) to read the map data server-side.
Then loads the block data in the browser for rendering with three.js

## Install

<pre>
git clone git@github.com:Qazzian/minecraft-mapper-js.git
cd minecraft-mapper-js
npm install
</pre>

## Setup

Copy your Minecraft map folder into minecraft-mapper-js/map.  
Map locations depend on which OS you run Minecraft on.

* Windows: 'C:\Users\your username\appdata\roaming\.minecraft\saves' by going to run and entering '%appdata%'
* Mac OS X: Go to the "Go" menu in the Finder, click "Go to folder", and type '~/Library/Application Support/minecraft/saves'
* Linux: Many repositories install Minecraft in the $HOME directory, '~/.minecraft/saves',

There are also a number of assets that you will need from the main Minecraft executable.  
Find a copy of the Minecraft.jar file and open it with a zip file manager.  The location will depend on which version you have and OS. I suggest using Google to find it for your environment.

Copy the jar file somewhere accessible.  
Change the file extension from .jar to .zip  

Copy the `blockstates`, `models` and `textures` folders into `minecraft-mapper-js/public`

Once you have done all of the above the directory structure should look like this:
<pre>
minecraft-mapper-js
├── map
│   ├── DIM-1
│   ├── DIM1
│   ├── data
│   ├── playerdata
│   ├── region
│   └── stats
└── public
    ├── blockstates
    ├── js
    │   └── lib
    ├── models
    │   ├── block
    │   └── item
    └── textures
        ├── blocks
        ├── colormap
        ├── effect
        ├── entity
        ├── environment
        ├── font
        ├── gui
        ├── items
        ├── map
        ├── misc
        ├── models
        ├── painting
        └── particle
</pre>

## Running
Start the server with `npm start`  
Go to http://localhost:3000/ in a browser that supports WebGl.   


# Thanks

This mapping tool has been built on top of the following libraries and frameworks: 
* [Three.js](https://threejs.org)
* [PrismarineJS](https://github.com/PrismarineJS/prismarine-world)

All images and textures are the copyright of Mojang.
