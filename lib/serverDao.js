const { Dao } = require("@live-change/dao")
const DaoWebsocket = require("@live-change/dao-websocket")

function reactiveObservableListConstructor(reactive) {
  class ReactiveObservableList extends Dao.ObservableList {
    constructor(value, what, dispose) {
      super(value, what, dispose, (data) => {
        if(data && typeof data == 'object') {
          const activated = reactive(data)
          return activated
        }
        return data
      })
    }
  }
  return ReactiveObservableList
}

function serverDao(credentials, ip, settings) {
  const serverHost = settings.remoteUrl || process.env.API_SERVER || "localhost:" + (process.env.API_PORT || 8002)
  const wsServer = `ws://${serverHost}/api/ws`

  return new Dao(credentials, {
    remoteUrl: wsServer,
    protocols: {
      'ws': DaoWebsocket.client
    },

    ...settings,

    connectionSettings: {
      headers: {
        'X-real-ip': ip,
        'X-forwarded-for': ip
      },
      queueRequestsWhenDisconnected: true,
      requestSendTimeout: 2300,
      requestTimeout: 10000,
      queueActiveRequestsOnDisconnect: false,
      autoReconnectDelay: 200,
      logLevel: 1,
      /*connectionMonitorFactory: (connection) =>
          new ReactiveDao.ConnectionMonitorPinger(connection, {
            pingInterval: 50,
            pongInterval: 200
          })*/
      ...(settings && settings.connectionSettings)
    },
    defaultRoute: {
      type: "remote",
      generator: settings.reactive ? reactiveObservableListConstructor(settings.reactive) : Dao.ObservableList
    }
  })
}

module.exports = serverDao
