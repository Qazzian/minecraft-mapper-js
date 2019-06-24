# Todo


### Split server and client side code
* ~~create separate express server for the client to serve the static assets~~

* replace socket.io connection (for performance)
** create an API to fetch blocks
** replace socket.io connector in the client side
    
### Refactor Server side code
create modules for 
  * reading map data
  * Communicating with the client
  * Reading a chunk of map data in one go


### Client side 
* Render blocks of the same type as a single object.

### feature slices
* Show the player location


### Authentication & multi map mode
Need a database
Need to store user data
need to store authentication tokens
Need to know about multiple maps in the system


Need to enable the uploading of a map
probably a separate service 
needs to save the Map data
Parse it to make sure it is valid
save it in a specific directory
save map, owner and directory location in the database
Can the map be public?


### Database
maps table
* id
* directory
* owner
* share permissions

Users table
* id
* email
* username

Session Table
* session id
* user id 




