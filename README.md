# minecraft-mapper-js
Render a Minecraft map in three.js

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

Copy a map saved file into minecraft-mapper-js/map.  
There are also a number of minecraft files you will need that I've not been able to script out yet.  
Find a copy of the Minecraft.jar file and open it with a zip file manager.  
Copy the `blockstates`, `models` and `textures` folders into `minecraft-mapper-js/public`

The directory structure should look like:
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
Go to http://localhost:3000/ in a WebGl supporting browser   

