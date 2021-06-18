const Dao = require("@live-change/dao")

async function createLoopbackDao(credentials, daoFactory) {
  const server = new Dao.ReactiveServer(daoFactory)
  const loopback = new Dao.LoopbackConnection(credentials, server, {})
  const dao = new Dao(credentials, {
    remoteUrl: 'dao',
    protocols: { local: null },
    defaultRoute: {
      type: "remote",
      generator: Dao.ObservableList
    },
    connectionSettings: {
      disconnectDebug: true,
      logLevel: 10,
    },
  })
  dao.connections.set('local:dao', loopback)
  await loopback.initialize()
  if(!loopback.connected) {
    console.error("LOOPBACK NOT CONNECTED?!")
    process.exit(1)
  }
  return dao
}

module.exports = createLoopbackDao
