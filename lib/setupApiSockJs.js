const sockjs = require('sockjs')

function setupApiSockJs(httpServer, apiServer) {
  const sockJsServer = sockjs.createServer({})
  sockJsServer.on('connection', function (conn) {
    if(!conn) {
      console.error("NULL SOCKJS connection")
      return;
    }
    console.log("SOCKJS connection")
    apiServer.handleConnection(conn)
  })
  sockJsServer.installHandlers(httpServer, { prefix: '/api/sockjs' })

  return sockJsServer
}

module.exports = setupApiSockJs
