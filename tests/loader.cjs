// Extracted from tests/loader.cjs in root project for local standalone test execution
// Provides CommonJS transpilation and SDK math/system stubs for TypeScript modules under node:test

const fs = require('node:fs'),
  path = require('node:path'),
  ts = require('typescript')

exports.loader = function (overrides = {}) {
  const cache = {}
  return function load(file) {
    file = path.resolve(file)
    if (cache[file]) return cache[file].exports
    const m = { exports: {} }
    cache[file] = m
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const mathStub = {
      Color4: { create: (r, g, b, a = 1) => ({ r, g, b, a }), fromHexString: (x) => ({ r: 1, g: 1, b: 1, a: 1 }) },
      Color3: { create: (r, g, b) => ({ r, g, b }), White: () => ({ r: 1, g: 1, b: 1 }) },
      Vector3: { create: (x, y, z) => ({ x, y, z }), Zero: () => ({ x: 0, y: 0, z: 0 }), One: () => ({ x: 1, y: 1, z: 1 }) },
      Quaternion: { Identity: () => ({ x: 0, y: 0, z: 0, w: 1 }), fromEulerDegrees: (x, y, z) => ({ x, y, z, w: 1 }) }
    }
    new Function('require', 'module', 'exports', js)(
      (name) => {
        if (name in overrides) return overrides[name]
        if (name === '~system/RestrictedActions') return { triggerEmote: async () => ({}), movePlayerTo: async () => ({}), openExplorerUi: async () => ({ openResult: 0 }) }
        if (name === '@dcl/sdk/math') return mathStub
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name) + '.ts')
        return require(name)
      },
      m,
      m.exports
    )
    return m.exports
  }
}
