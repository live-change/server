const cookie = require('cookie')
const path = require('path')
const serveStatic = require('serve-static')
const crypto = require('crypto')
const expressStaticGzip = require("express-static-gzip")

const serverDao = require('./serverDao.js')
const { hashCode, encodeNumber, uidGenerator } = require('@live-change/uid')
const getIp = require('./getIp.js')

const Renderer = require('./Renderer.js')

class SsrServer {
  constructor(express, manifest, settings) {
    this.manifest = manifest
    this.settings = settings

    this.version = settings.version || 'unknown'
    this.express = express
    this.renderer = new Renderer(manifest, settings)

    this.instanceId = encodeNumber(hashCode(
      `ssr${process.pid}${require("os").hostname()} ${process.cwd()}/${process.argv.join(' ')}`))
    this.uidGenerator = uidGenerator(this.instanceId, 1)

    this.root = this.settings.root || process.cwd()
  }

  async start() {
    await this.renderer.start()

    if(this.settings.dev) {
      this.express.use(this.renderer.vite.middlewares)
    } else {
      const staticPath = path.resolve(this.root, 'dist/client')
      this.express.use('/', expressStaticGzip(staticPath, {
        //enableBrotli: true,
        index: false,
        customCompressions: [{
          encodingName: 'br',
          fileExtension: 'br'
        },{
          encodingName: 'gzip',
          fileExtension: 'gz'
        },{
          encodingName: 'deflate',
          fileExtension: 'zz'
        }],
        orderPreference: ['br', 'gzip', 'deflate']
      }))
      //this.express.use(serveStatic(staticPath, { index: false }))
    }

    await this.setupSsr()
  }

  async setupSsr() {
    const readCredentials = this.settings.readCredentials || ((req) => {
      const cookies = cookie.parse(req.headers.cookie || '')
      return { sessionKey: cookies.sessionKey || crypto.randomBytes(64).toString('base64').slice(0, 48) }
    })
    const writeCredentials = this.settings.writeCredentials || ((res, credentials) => {
      //console.log("WRITE CREDENTIALS", credentials)
      const cookieExpireDate =
        this.settings.sessionExpires ? new Date(Date.now() + this.settings.sessionExpires).toUTCString() : null
      if(credentials.sessionKey) {
        res.set({
          'Set-Cookie': `sessionKey=${credentials.sessionKey}; Path=/; HttpOnly`
          + (cookieExpireDate ? `; Expires=${cookieExpireDate}` : '')
        })
      }
    })
    this.express.use('*', async (req, res) => {
      const url = req.originalUrl
      const clientIp = getIp(req)

      const credentials = readCredentials(req)
      const windowId = this.uidGenerator()
      try {
        let dao
        if(this.settings.daoFactory) {
          dao = await this.settings.daoFactory(credentials, clientIp)
        } else {
          const host = (this.settings.apiHost == '0.0.0.0' || !this.settings.apiHost)
            ? 'localhost' : this.settings.apiHost
          dao = await serverDao(credentials, clientIp, {
            remoteUrl: `ws://${host}:${this.settings.apiPort || 8002}/api/ws`
          })
        }
        if(!dao)
          throw new Error("Impossible to render page without data access object. Define apiServer or daoFactory!")

        const version = this.version

        const html = await this.renderer.renderPage({ url, dao, clientIp, credentials, windowId, version })

        res.status(200)
        writeCredentials(res, credentials)
        res.set({
          'Content-Type': 'text/html'
        })
        res.end(html)
      } catch (e) {
        this.renderer.fixStackTrace(e)
        console.error("RENDERING ERROR", e.stack || e)
        res.status(500).end(e.stack)
      }
    })
  }

  async close() {
    await this.renderer.close()
  }
}

module.exports = SsrServer
