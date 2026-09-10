const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
test('preview package cannot depend on itself and recurse through its watcher', () => {
  const root = path.resolve(__dirname, '..')
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    assert.equal(pkg[key]?.[pkg.name], undefined)
  }
  assert.equal(fs.existsSync(path.join(root, 'node_modules', pkg.name)), false)
})
