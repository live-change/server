const setupDbServer = require('./setupDbServer.js')
const setupDbClient = require('./setupDbClient.js')

async function setupApp(settings, env = process.env) {
  const app = require("@live-change/framework").app()
  let dbServer
  if(settings.withDb) {
    dbServer = await setupDbServer(settings)
    //app.dao.dispose()
    const loopbackDao = await createLoopbackDao('local', () => dbServer.createDao('local'))
    app.dao = loopbackDao
    // loopbackDao.prepareSource(app.dao.definition.database)
    // loopbackDao.prepareSource(app.dao.definition.store)
  } else {
    app.dao = setupDbClient(settings)
  }
  app.databaseName = env.DB_NAME || 'test'
}

module.exports = setupApp