### Release 1.0.0

This App suits best for League Racing in the F1 2021 game.
It's purpose is to provide best information to viewers of F1 2021 races.


# How to?
Set up your UDP Telemetry to stream to your Server. The Server will be listening to Port 20777 on default.
You will need to have an App connecting to this server by the websocket protocol (ws://) on Port 8999.

To ensure that the names will suit the Drivers you need to provide a Lineup.

# Config

use `.env` file to configure your telemetry app.
```
LINEUP_FILE=lineup.json
UDP_PORT=2777
FWRD_PORT=5550
WS_PORT=8999
BACKUP_FILE=backup.json
RESTORE_BACKUP=true
```

`LINEUP_FILE` is a JSON where you configure the Names of Drivers for every Car No. Unfortunally the Game doesn't provide us with this data.
`UDP_PORT` is where your telemetry app listes for the UDP Data from the game. On default the game will send data to port 2777
`FWRD_PORT` for some circumstances you want to use the UDP Data in different apps so LTB will forward the UDP Packages to this port.
`WS_PORT` is the port where the websocket connection will use.
`BACKUP_FILE` LTB will use this file to get some data until there is data input from UDP if `RESTORE_BACKUP` is true.

# Start
To start use `npm run start`












