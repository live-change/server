const path = require('path')
const http = require('http')
const express = require('express')

const app = require('@live-change/framework').app()

const setupApiServer = require('./setupApiServer.js')
const setupApiSockJs = require('./setupApiSockJs.js')
const setupApiWs = require('./setupApiWs.js')
const setupApp = require('./setupApp.js')
const setupDbServer = require('./setupDbServer.js')
const createLoopbackDao = require('./createLoopbackDao.js')
const SsrServer = require('./SsrServer.js')

class TestServer {
  constructor(config) {
    this.config = config
  }

  async start() {
    this.expressApp = express()

    this.manifest = this.config.dev ? null : require(
      path.resolve(this.config.ssrRoot, 'dist/client/ssr-manifest.json')
    )

    await setupApp({
      withDb: true,
      dbBackend: 'mem'
    })

    await app.dao.request(['database', 'createDatabase'], app.databaseName, { }).catch(err => 'exists')

    this.apiServer = await setupApiServer({
      withServices: true,
      updateServices: true,
      ...this.config
    }, this.dbServer)

    this.ssrServer = new SsrServer(this.expressApp, this.manifest, {
      dev: this.dev,
      root: this.config.ssrRoot,
      daoFactory: async (credentials, ip) => {
        return await this.createDao(credentials, ip)
      },
      ...this.config
    })

    await this.ssrServer.start()

    this.expressServer = http.createServer(this.expressApp)
    this.services = this.apiServer.services.getServicesObject()

    this.wsServer = await setupApiWs(this.expressServer, this.apiServer)
    this.sockJsServer = await setupApiSockJs(this.expressServer, this.apiServer)

    await new Promise((resolve, reject) => {
      this.httpServer = this.expressServer.listen(this.config.port || 0, () => {
        this.port = this.expressServer.address().port,
        this.url = `http://localhost:${this.expressServer.address().port}`
        resolve()
      })
    })
  }
  async createDao(credentials, ip) {
    return await createLoopbackDao(credentials, () => this.apiServer.daoFactory(credentials, ip))
  }

  dispose() {
    this.httpServer.close()
    this.dbServer.close()
    //this.wsServer.close()
    //this.sockJsServer.close()
  }
}

module.exports = TestServer
