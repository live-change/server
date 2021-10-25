
const ReactiveDao = require("@live-change/dao")
const ReactiveDaoWebsocket = require("@live-change/dao-websocket")

function setupDbClient(argv, env = process.env) {
  config = {
    url: env.DB_URL,
    name: env.DB_NAME,
    requestTimeout: (+env.DB_REQUEST_TIMEOUT),
    cache: env.DB_CACHE == "YES",
    //unobserveDebug: env.UNOBSERVE_DEBUG == "YES",
  }
  const dbDao = new ReactiveDao(process.cwd()+' '+process.argv.join(' '), {
    remoteUrl: config?.url || "http://localhost:9417/api/ws",
    protocols: {
      'ws': ReactiveDaoWebsocket.client
    },
    connectionSettings: {
      queueRequestsWhenDisconnected: true,
      requestSendTimeout: 2000,
      requestTimeout: this.requestTimeout,
      queueActiveRequestsOnDisconnect: false,
      autoReconnectDelay: 200,
      logLevel: 1,
      unobserveDebug: config?.unobserveDebug || false
    },
    database: {
      type: 'remote',
      generator: ReactiveDao.ObservableList
    },
    store: {
      type: 'remote',
      generator: ReactiveDao.ObservableList
    }
  })

  if(config?.cache) return new ReactiveDao.DaoCache(dbDao)
  return dbDao
}

module.exports = setupDbClient