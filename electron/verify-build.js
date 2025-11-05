// Verify that the standalone build exists before packaging
const fs = require('fs')
const path = require('path')

const standalonePath = path.join(__dirname, '../.next/standalone')
const serverPath = path.join(standalonePath, 'server.js')
const nodeModulesPath = path.join(standalonePath, 'node_modules')

if (!fs.existsSync(standalonePath)) {
  console.error('❌ ERROR: Standalone build not found at:', standalonePath)
  console.error('Please run: BUILD_STANDALONE=true npm run build')
  process.exit(1)
}

if (!fs.existsSync(serverPath)) {
  console.error('❌ ERROR: server.js not found in standalone build')
  console.error('Expected at:', serverPath)
  process.exit(1)
}

if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ ERROR: node_modules not found in standalone build')
  console.error('Expected at:', nodeModulesPath)
  console.error('Standalone build is incomplete. Check Next.js build output.')
  process.exit(1)
}

// Check if 'next' module exists
const nextModulePath = path.join(nodeModulesPath, 'next')
if (!fs.existsSync(nextModulePath)) {
  console.error('❌ ERROR: next module not found in node_modules')
  console.error('Expected at:', nextModulePath)
  console.error('Standalone build may be missing dependencies.')
  process.exit(1)
}

console.log('✅ Standalone build found at:', standalonePath)
console.log('✅ server.js found at:', serverPath)
console.log('✅ node_modules found at:', nodeModulesPath)
console.log('✅ next module found')

// List some contents to verify
try {
  const contents = fs.readdirSync(standalonePath)
  console.log('📁 Standalone directory contents:', contents.slice(0, 10).join(', '), '...')
} catch (e) {
  console.warn('⚠️  Could not list standalone directory:', e.message)
}

process.exit(0)

