const WebSocketServer = require('websocket').server
const DaoWebsocket = require("@live-change/dao-websocket")

function setupApiWs(httpServer, apiServer) {
  const wsServer = new WebSocketServer({ httpServer, autoAcceptConnections: false })
  wsServer.on("request",(request) => {
    console.log("WS URI", request.httpRequest.url)
    if(request.httpRequest.url != "/api/ws") return request.reject()
    let serverConnection = new DaoWebsocket.server(request)
    apiServer.handleConnection(serverConnection)
  })
  return wsServer
}

module.exports = setupApiWs