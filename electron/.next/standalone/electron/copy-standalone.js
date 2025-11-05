// Copy standalone build to a predictable location for electron-builder
const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, '../.next/standalone')
const targetDir = path.join(__dirname, '.next/standalone')

// Also need to copy the .next directory that standalone references
const nextSource = path.join(__dirname, '../.next')
const nextTarget = path.join(__dirname, '.next')

if (!fs.existsSync(sourceDir)) {
  console.error('❌ Standalone build not found at:', sourceDir)
  console.error('Please run: BUILD_STANDALONE=true npm run build')
  process.exit(1)
}

// Copy recursively, resolving symlinks for node_modules
function copyRecursive(src, dest, resolveSymlinks = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    // Skip if already exists (avoid overwriting)
    if (fs.existsSync(destPath)) {
      continue
    }
    
    try {
      if (entry.isSymbolicLink()) {
        // For node_modules, resolve symlinks to actual directories
        if (resolveSymlinks || entry.name === 'node_modules') {
          const realPath = fs.realpathSync(srcPath)
          if (fs.statSync(realPath).isDirectory()) {
            // Copy the actual directory instead of symlink
            copyRecursive(realPath, destPath, true)
          } else {
            fs.copyFileSync(realPath, destPath)
          }
        } else {
          // Preserve other symlinks
          const linkTarget = fs.readlinkSync(srcPath)
          fs.symlinkSync(linkTarget, destPath)
        }
      } else if (entry.isDirectory()) {
        // Always resolve symlinks for node_modules
        copyRecursive(srcPath, destPath, resolveSymlinks || entry.name === 'node_modules')
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    } catch (e) {
      console.warn(`Warning: Could not copy ${entry.name}: ${e.message}`)
    }
  }
}

console.log('Copying standalone build to electron directory...')

// First, verify what's in the standalone directory
try {
  const standaloneContents = fs.readdirSync(sourceDir)
  console.log('📁 Standalone directory contains:', standaloneContents.join(', '))
  
  // Check if node_modules exists
  const nodeModulesInSource = path.join(sourceDir, 'node_modules')
  if (!fs.existsSync(nodeModulesInSource)) {
    console.error('❌ ERROR: node_modules not found in standalone build!')
    console.error('Expected at:', nodeModulesInSource)
    console.error('This means the standalone build is incomplete.')
    console.error('Contents found:', standaloneContents.join(', '))
    process.exit(1)
  }
  console.log('✅ node_modules found in standalone build')
} catch (e) {
  console.error('❌ ERROR: Could not read standalone directory:', e.message)
  process.exit(1)
}

// Copy standalone directory (this will resolve symlinks for node_modules)
copyRecursive(sourceDir, targetDir)
console.log('✅ Standalone build copied to:', targetDir)

// Verify node_modules was copied
const nodeModulesInTarget = path.join(targetDir, 'node_modules')
if (!fs.existsSync(nodeModulesInTarget)) {
  console.warn('⚠️  node_modules not found after copy, checking source...')
  
  // Check if source has node_modules as symlink
  const nodeModulesInSource = path.join(sourceDir, 'node_modules')
  if (fs.existsSync(nodeModulesInSource)) {
    try {
      const stats = fs.lstatSync(nodeModulesInSource)
      if (stats.isSymbolicLink()) {
        console.log('📦 node_modules is a symlink, resolving...')
        const realPath = fs.realpathSync(nodeModulesInSource)
        console.log('   Symlink points to:', realPath)
        
        // Copy from the real path
        if (fs.existsSync(realPath)) {
          copyRecursive(realPath, nodeModulesInTarget, true)
          console.log('✅ node_modules copied from symlink target')
        } else {
          console.error('❌ Symlink target does not exist:', realPath)
          process.exit(1)
        }
      }
    } catch (e) {
      console.error('❌ Error resolving node_modules symlink:', e.message)
      process.exit(1)
    }
  } else {
    console.error('❌ ERROR: node_modules not found in source standalone build!')
    console.error('Expected at:', nodeModulesInSource)
    process.exit(1)
  }
} else {
  console.log('✅ node_modules copied successfully')
  
  // Verify 'next' module exists
  const nextModule = path.join(nodeModulesInTarget, 'next')
  if (!fs.existsSync(nextModule)) {
    console.error('❌ ERROR: next module not found in copied node_modules!')
    process.exit(1)
  }
  console.log('✅ next module verified')
}

// Copy the .next directory (standalone may reference it)
if (fs.existsSync(nextSource)) {
  console.log('Copying .next directory...')
  // Only copy static and server directories, not everything
  const staticSrc = path.join(nextSource, 'static')
  const staticDest = path.join(nextTarget, 'static')
  if (fs.existsSync(staticSrc)) {
    copyRecursive(staticSrc, staticDest)
    console.log('✅ .next/static copied')
  }
} else {
  console.warn('⚠️  .next directory not found at:', nextSource)
}

