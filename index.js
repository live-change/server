const Renderer = require('./lib/Renderer.js')
const Services = require('./lib/Services.js')
const SsrServer = require('./lib/SsrServer.js')
const TestServer = require('./lib/TestServer.js')

const createLoopbackDao = require('./lib/createLoopbackDao.js')
const renderTemplate = require('./lib/renderTemplate.js')
const setupApiServer = require('./lib/setupApiServer.js')
const setupApiSockJs = require('./lib/setupApiSockJs.js')
const setupApiWs = require('./lib/setupApiWs.js')
const setupDbServer = require('./lib/setupDbServer.js')
const setupDbClient = require('./lib/setupDbClient.js')
const setupApp = require('./lib/setupApp.js')

module.exports = {

  Renderer,
  Services,
  SsrServer,
  TestServer,

  createLoopbackDao,
  renderTemplate,
  setupApiServer,
  setupApiSockJs,
  setupApiWs,
  setupDbServer,
  setupDbClient,
  setupApp

}
