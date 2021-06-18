const path = require('path')
const DbServer = require('@live-change/db-server')

async function setupDbServer(settings) {
  const { dbRoot, dbBackend, dbBackendUrl, dbSlowStart } = settings
  console.info(`starting database in ${dbBackend == 'mem' ? 'memory' : path.resolve(dbRoot)}`)
  let server = new DbServer({
    dbRoot,
    backend: dbBackend,
    backendUrl: dbBackendUrl,
    slowStart: dbSlowStart,
    temporary: dbBackend == "mem"
  })

  process.on('unhandledRejection', (reason, promise) => {
    if(reason.stack && reason.stack.match(/\s(userCode:([a-z0-9_.\/-]+):([0-9]+):([0-9]+))\n/i)) {
      server.handleUnhandledRejectionInQuery(reason, promise)
    } 
  })

  await server.initialize()
  console.info(`database initialized!`)

  return server
}

module.exports = setupDbServer
