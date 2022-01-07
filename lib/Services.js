const { def } = require('@vue/shared')
const fs = require('fs')
const path = require('path')
const resolve = require('util').promisify(require('resolve'))
const app = require("@live-change/framework").app()

const debug = require('debug')('framework')

class Services {
  constructor(configPath) {
    if(!configPath) throw new Error("services config parameter is required")
    this.configPath = path.resolve(configPath)
    this.config = require(path.resolve(this.configPath))
    this.servicesDir = path.dirname(this.configPath)

    this.plugins = []
    this.serviceDefinitions = []
    this.services = []
  }

  async resolve(file) {
    const path = await resolve(file, { basedir: this.servicesDir })
    debug("PATH RESOLVE", file, "IN", this.servicesDir, "=>", path)
    return path
  }
  async getServiceEntryFile(config) {
    const path = await resolve(config.path, { basedir: this.servicesDir })
    debug("PATH RESOLVE", config.path, "IN", this.servicesDir, "=>", path)
    return path
  }

  servicesList() {
    return this.config.services.map(s => s.name)
  }
  serviceConfig(serviceName) {
    return this.config.services.find(s => s.name = serviceName)
  }
  async loadServices() {
    app.config.services = this.config.services
    app.config.plugins = this.config.plugins
    if(this.config.plugins) {
      for(const plugin of this.config.plugins) {
        const entryFile = await this.getServiceEntryFile(plugin)
        debug("PLUGIN", plugin, 'ENTRY FILE', entryFile)
        this.plugins.push(require(entryFile))
      }
    }
    if(this.config.services) {
      for(const service of this.config.services) {
        const entryFile = await this.getServiceEntryFile(service)
        debug("SERVICE", service, 'ENTRY FILE', entryFile)
        const definition = require(entryFile)
        if(definition.name != service.name) {
          console.error("SERVICE", service, "NAME", service.name, "MISMATCH", definition.name)
          process.exit(1)
        }
        this.serviceDefinitions.push(definition)
      }
    }

    /// TODO: load dependent services!!!
  }

  generateApiFile(path) {
    const out = fs.createWriteStream(path)
    out.write("import api from 'api'\n")
    out.write("import Vue from 'vue'\n\n")
    out.write("const views = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const viewName in serviceDefinition.views) {
        const viewDefinition = serviceDefinition.views[viewName]
        out.write(`    ${viewName}({ ${Object.keys(viewDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return ['${serviceDefinition.name}', '${viewName}', `+
            `{ ${Object.keys(viewDefinition.properties).join(', ')} }]\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("const fetch = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const viewName in serviceDefinition.views) {
        const viewDefinition = serviceDefinition.views[viewName]
        out.write(`    ${viewName}({ ${Object.keys(viewDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return api.fetch(['${serviceDefinition.name}', '${viewName}', `+
            `{ ${Object.keys(viewDefinition.properties).join(', ')} }])\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("const actions = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const actionName in serviceDefinition.actions) {
        const actionDefinition = serviceDefinition.actions[actionName]
        out.write(`    async ${actionName}({ ${Object.keys(actionDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return await api.command(['${serviceDefinition.name}', '${actionName}'], `+
            `{ ${Object.keys(actionDefinition.properties).join(', ')} })\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("api.views = views\n")
    out.write("api.actions = actions\n")
    out.write("api.fetch = fetch\n")
    out.write("Vue.prototype.$views = views\n")
    out.write("Vue.prototype.$actions = actions\n")
    out.write("Vue.prototype.$session = api.session\n")
    out.write("export default { views, actions }\n")
    out.end()
  }

  async update() {
    await Promise.all(this.serviceDefinitions.map(defn => {
      if(!defn.processed) {
        app.processServiceDefinition(defn, [ ...app.defaultProcessors ])
        defn.processed = true
      }
      return app.updateService(defn)
    }))
  }

  async start(startOptions) {
    await Promise.all(this.plugins.map(plugin => plugin(app, this)))
    this.services = await Promise.all(this.serviceDefinitions.map(defn => {
      if(!defn.processed) {
        app.processServiceDefinition(defn, [ ...app.defaultProcessors ])
        defn.processed = true
      }
      return app.startService(defn, startOptions)
    }))
  }

  getServicesObject() {
    let object = {}
    for(const service of this.services) object[service.name] = service
    return object
  }

}

module.exports = Services
