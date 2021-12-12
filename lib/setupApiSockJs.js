const sockjs = require('@live-change/sockjs')

function setupApiSockJs(httpServer, apiServer) {
  const sockJsServer = sockjs.createServer({
    prefix: '/api/sockjs',
    transports: [ 'websocket', 'websocket-raw', 'xhr-polling', 'xhr-streaming' ]
  })
  sockJsServer.on('connection', function (conn) {
    if(!conn) {
      console.error("NULL SOCKJS connection")
      return;
    }
    console.log("SOCKJS connection")
    apiServer.handleConnection(conn)
  })
  sockJsServer.attach(httpServer)

  return sockJsServer
}

module.exports = setupApiSockJs
