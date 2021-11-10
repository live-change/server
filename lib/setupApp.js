const { hashCode, encodeNumber, uidGenerator } = require('@live-change/uid')

const setupDbServer = require('./setupDbServer.js')
const setupDbClient = require('./setupDbClient.js')
const createLoopbackDao = require('./createLoopbackDao.js')

async function setupApp(settings, env = process.env) {
  const app = require("@live-change/framework").app()
  app.instanceId = encodeNumber(hashCode(
    `app${process.pid}${require("os").hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
  app.uidGenerator = uidGenerator(app.instanceId, 1)
  console.log("SETUP APP", settings)
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