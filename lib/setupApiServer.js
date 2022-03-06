const cookie = require("cookie")
const Dao = require("@live-change/dao")
const { connection } = require("websocket")
const Services = require('../lib/Services.js')
const app = require("@live-change/framework").app()


async function setupApiServer(settings) {
  const { services: config, withServices, updateServices } = settings

  const services = new Services(config)

  await services.loadServices()
  if(updateServices) await services.update()
  await services.start(withServices
      ? { runCommands: true, handleEvents: true, indexSearch: true }
      : { runCommands: false, handleEvents: false, indexSearch: false })

  if(settings.initScript) {
    const initScript = require(await services.resolve(settings.initScript))
    await initScript(services.getServicesObject())
  }

  const apiServerConfig = {
    services: services.services,
    //local, remote, <-- everything from services
    local(credentials) {
      const local = {
        version: new Dao.SimpleDao({
          values: {
            version: {
              observable() {
                return new Dao.ObservableValue(process.env.VERSION)
              },
              async get() {
                return process.env.VERSION
              }
            }
          }
        })
      }
      if(settings.dbAccess) {
        local.serverDatabase = {
          observable(what) {
            return app.dao.observable(['database', ...what.slice(1)])
          },
          get(what) {
            return app.dao.get(['database', ...what.slice(1)])
          },
          request(what, ...args) {
            return app.dao.request(['database', ...what.slice(1)], ...args)
          }
        }
      }
      return local
    },
    shareDefinition: true,
    logErrors: true,
    createSessionOnUpdate: true, /// deprecated - moved to session-service settings
    fastAuth: settings.fastAuth /* && ((connection) => {
      const cookies = cookie.parse(connection.headers.cookie || '')
      return {
        sesionId: cookies.sessionId,
        sessionKey: cookies.sessionKey
      }
    }) */
  }

  const apiServer = await app.createLiveApiServer(apiServerConfig)

  apiServer.services = services

  return apiServer
}

module.exports = setupApiServer
