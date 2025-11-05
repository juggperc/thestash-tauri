const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Load IPC handlers
require('./ipc-handlers')

// Logging helper
const logMessages = []
const maxLogMessages = 50

function log(message, level = 'info') {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`
  console.log(logEntry)
  logMessages.push(logEntry)
  if (logMessages.length > maxLogMessages) {
    logMessages.shift()
  }
  
  // Also write to file for packaged apps
  if (app.isPackaged) {
    try {
      const logFile = join(app.getPath('userData'), 'app.log')
      fs.appendFileSync(logFile, logEntry + '\n')
    } catch (e) {
      // Ignore log file errors
    }
  }
}

function getRecentLogs() {
  return logMessages.slice(-20).join('\n')
}

let mainWindow
let nextProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    title: 'the stash',
    trafficLightPosition: { x: 20, y: 20 },
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // Start Next.js server in production using Electron's Node.js
    const fs = require('fs')
    const { execPath } = require('process')
    
    // Determine the correct path to standalone build
    // In packaged app, unpacked files are in Resources/app.asar.unpacked
    let nextStandalone = null
    
    // Use bundled Node.js or fall back to system Node.js
    let nodePath = 'node'
    
    if (app.isPackaged) {
      // In packaged app, use bundled Node.js first
      const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
      const bundledNodePath = join(process.resourcesPath, 'node-' + arch, 'node')
      
      if (fs.existsSync(bundledNodePath)) {
        // Verify it's actually executable
        try {
          fs.accessSync(bundledNodePath, fs.constants.X_OK)
          nodePath = bundledNodePath
          log(`Using bundled Node.js: ${nodePath}`)
        } catch (e) {
          log(`Bundled Node.js exists but may not be executable: ${e.message}`, 'warn')
          // Fall through to system Node.js
        }
      }
      
      // If bundled Node.js not found or not executable, try system Node.js
      if (nodePath === 'node' || !nodePath.includes('node-')) {
        log('Bundled Node.js not available, using system Node.js...', 'warn')
        const possiblePaths = [
          '/opt/homebrew/bin/node',  // M1/M2 Macs with Homebrew
          '/usr/local/bin/node',      // Intel Macs with Homebrew
          '/usr/bin/node',            // System Node (usually old)
        ]
        
        // Also try 'which node' to find it in PATH
        try {
          const { execSync } = require('child_process')
          const whichNode = execSync('which node', { 
            encoding: 'utf8',
            env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin' }
          }).trim()
          if (whichNode && fs.existsSync(whichNode)) {
            possiblePaths.unshift(whichNode) // Put PATH result first
          }
        } catch (e) {
          log(`Could not find node via which: ${e.message}`, 'warn')
        }
        
        // Also check PATH environment variable
        if (process.env.PATH) {
          const pathDirs = process.env.PATH.split(':')
          for (const dir of pathDirs) {
            const nodeInPath = join(dir, 'node')
            if (fs.existsSync(nodeInPath) && !possiblePaths.includes(nodeInPath)) {
              possiblePaths.push(nodeInPath)
            }
          }
        }
        
        log('Searching for system Node.js:')
        for (const path of possiblePaths) {
          const exists = fs.existsSync(path)
          log(`  ${path}: ${exists ? 'FOUND ✓' : 'NOT FOUND ✗'}`)
          if (exists) {
            // Verify it's executable
            try {
              fs.accessSync(path, fs.constants.X_OK)
              nodePath = path
              log(`  → Using: ${path}`)
              break
            } catch (e) {
              log(`  → Not executable: ${e.message}`)
            }
          }
        }
      }
    } else {
      // In development, use system node
      try {
        const { execSync } = require('child_process')
        const whichNode = execSync('which node', { encoding: 'utf8' }).trim()
        if (whichNode) {
          nodePath = whichNode
        }
      } catch (e) {
        // Fall back to 'node' command
        nodePath = 'node'
      }
    }
    
    // Debug: log the paths we're checking
    log('Looking for standalone build...')
    log(`__dirname: ${__dirname}`)
    log(`process.resourcesPath: ${process.resourcesPath}`)
    log(`app.getAppPath(): ${app.getAppPath()}`)
    log(`app.isPackaged: ${app.isPackaged}`)
    
    // List what's actually in resourcesPath for debugging
    if (app.isPackaged && process.resourcesPath) {
      try {
        const resourcesContents = fs.readdirSync(process.resourcesPath)
        console.log('Contents of process.resourcesPath:', resourcesContents)
        
        // Check if app.asar.unpacked exists
        const unpackedPath = join(process.resourcesPath, 'app.asar.unpacked')
        if (fs.existsSync(unpackedPath)) {
          const unpackedContents = fs.readdirSync(unpackedPath)
          console.log('Contents of app.asar.unpacked:', unpackedContents)
          
          // Check if .next exists in unpacked
          const nextInUnpacked = join(unpackedPath, '.next')
          if (fs.existsSync(nextInUnpacked)) {
            const nextContents = fs.readdirSync(nextInUnpacked)
            console.log('Contents of app.asar.unpacked/.next:', nextContents)
          }
        }
      } catch (e) {
        console.error('Error reading resourcesPath:', e)
      }
    }
    
    // List all possible paths to check
    const allPathsToCheck = app.isPackaged ? [
      // Check in app.asar.unpacked (where unpacked files go)
      join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone'),
      join(process.resourcesPath, 'app.asar.unpacked', 'electron', '.next', 'standalone'),
      // Check in resources directly
      join(process.resourcesPath, '.next', 'standalone'),
      // Check relative to main.js location
      join(__dirname, '.next', 'standalone'),
      join(__dirname, '..', '.next', 'standalone'),
      // Check other possible locations
      join(process.resourcesPath, 'app', '.next', 'standalone'),
      join(process.resourcesPath, '..', '.next', 'standalone'),
      join(app.getAppPath(), '.next', 'standalone'),
      join(app.getAppPath(), '..', '.next', 'standalone'),
    ] : [
      // Development: check both locations
      join(__dirname, '.next/standalone'),
      join(__dirname, '../.next/standalone')
    ]
    
    log('Checking paths:')
    for (const path of allPathsToCheck) {
      const exists = fs.existsSync(path)
      log(`  ${path}: ${exists ? 'EXISTS ✓' : 'NOT FOUND ✗'}`)
      if (exists && !nextStandalone) {
        nextStandalone = path
        log(`  → Selected: ${path}`)
      }
    }
    
    log(`Selected path: ${nextStandalone}`)
    log(`Using node at: ${nodePath}`)
    
    // Helper function to show errors
    function showError(message) {
      const recentLogs = getRecentLogs()
      const logFile = app.isPackaged ? join(app.getPath('userData'), 'app.log') : 'console'
      
      const errorHtml = `
        <html>
          <head>
            <style>
              body {
                font-family: monospace;
                padding: 40px;
                background: #000;
                color: #fff;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              pre {
                text-align: left;
                background: #111;
                padding: 20px;
                border: 1px solid #333;
                max-width: 900px;
                overflow: auto;
                font-size: 12px;
                max-height: 60vh;
              }
              .section {
                margin: 20px 0;
              }
              h2 {
                font-size: 16px;
                margin-top: 30px;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <h1>Error</h1>
            <div class="section">
              <pre>${message}</pre>
            </div>
            <h2>Recent Logs:</h2>
            <div class="section">
              <pre>${recentLogs || 'No logs available'}</pre>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
              Full logs saved to: ${logFile}
            </p>
          </body>
        </html>
      `
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(errorHtml))
    }
    
    // Check if standalone build exists
    if (nextStandalone && fs.existsSync(nextStandalone)) {
      const serverPath = join(nextStandalone, 'server.js')
      
      // Verify server.js exists
      if (!fs.existsSync(serverPath)) {
        log(`server.js not found at: ${serverPath}`, 'error')
        showError(`server.js not found at:\n${serverPath}\n\nPlease rebuild the app.`)
        return
      }
      
      // Check for node_modules in standalone directory
      const nodeModulesPath = join(nextStandalone, 'node_modules')
      if (!fs.existsSync(nodeModulesPath)) {
        log(`node_modules not found in standalone build at: ${nodeModulesPath}`, 'error')
        log(`Contents of standalone directory:`, 'error')
        try {
          const contents = fs.readdirSync(nextStandalone)
          log(`  ${contents.join(', ')}`, 'error')
        } catch (e) {
          log(`  Could not read directory: ${e.message}`, 'error')
        }
        showError(`node_modules not found in standalone build.\n\nStandalone build may be incomplete.\nPlease rebuild with BUILD_STANDALONE=true`)
        return
      }
      
      let serverReady = false
      
      // Verify node binary exists and is executable
      if (!fs.existsSync(nodePath)) {
        log(`Node.js binary not found at: ${nodePath}`, 'error')
        showError(`Node.js binary not found at:\n${nodePath}\n\nPlease rebuild the app.`)
        return
      }
      
      // Check if binary is executable
      try {
        fs.accessSync(nodePath, fs.constants.X_OK)
      } catch (e) {
        log(`Node.js binary is not executable: ${nodePath}`, 'error')
        showError(`Node.js binary is not executable:\n${nodePath}\n\nError: ${e.message}`)
        return
      }
      
      log(`Starting Next.js server with Node.js: ${nodePath}`)
      log(`Server path: ${serverPath}`)
      log(`Working directory: ${nextStandalone}`)
      log(`Node modules: ${nodeModulesPath} (exists: ${fs.existsSync(nodeModulesPath)})`)
      
      // Set NODE_PATH to ensure modules can be found
      const nodePathEnv = nextStandalone
      
      nextProcess = spawn(nodePath, [serverPath], {
        cwd: nextStandalone,
        env: { 
          ...process.env, 
          PORT: '3000', 
          NODE_ENV: 'production',
          NEXT_RUNTIME: 'nodejs',
          NODE_PATH: nodePathEnv, // Help Node.js find modules
          // Ensure bundled Node.js can find its libraries
          DYLD_LIBRARY_PATH: app.isPackaged && nodePath.includes('node-') 
            ? join(process.resourcesPath, 'node-' + (process.arch === 'arm64' ? 'arm64' : 'x64'), 'lib')
            : undefined
        },
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      nextProcess.stdout.on('data', (data) => {
        const output = data.toString()
        log(`Next.js stdout: ${output}`)
        // Check for server ready message
        if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
          log('✓ Server appears to be ready based on output')
        }
      })
      
      nextProcess.stderr.on('data', (data) => {
        const error = data.toString()
        log(`Next.js stderr: ${error}`, 'error')
        // If we see certain errors, show them
        if (error.includes('EADDRINUSE')) {
          showError('Port 3000 is already in use. Please close other applications using this port.')
        } else if (error.includes('Error')) {
          showError('Server error: ' + error.substring(0, 500))
        }
      })
      
      nextProcess.on('exit', (code, signal) => {
        log(`Next.js process exited with code ${code}, signal ${signal}`, 'error')
        if (code !== 0 && code !== null && !serverReady) {
          let errorMsg = `Server process exited unexpectedly.\n\n`
          errorMsg += `Exit code: ${code}\n`
          errorMsg += `Signal: ${signal || 'none'}\n`
          errorMsg += `Node path: ${nodePath}\n`
          errorMsg += `Node exists: ${fs.existsSync(nodePath)}\n\n`
          
          // Try to get stderr output if available
          if (code === 127 || code === 1) {
            errorMsg += `This usually means:\n`
            errorMsg += `- Node.js binary not found or not executable\n`
            errorMsg += `- Missing shared libraries\n`
            errorMsg += `- Binary architecture mismatch\n\n`
            errorMsg += `Attempted bundled path: ${nodePath}\n\n`
            
            // If bundled Node.js failed, suggest using system Node.js
            if (nodePath.includes('node-')) {
              errorMsg += `The bundled Node.js failed. The app will try to use system Node.js on next launch.\n`
              errorMsg += `If this persists, ensure Node.js is installed:\n`
              errorMsg += `  brew install node\n`
            } else {
              errorMsg += `Please rebuild the app to bundle Node.js correctly.`
            }
          } else {
            errorMsg += `Check the logs below for error details.`
          }
          showError(errorMsg)
        }
      })
      
      nextProcess.on('error', (error) => {
        log(`Failed to start Next.js server: ${error.message}`, 'error')
        log(`Node path attempted: ${nodePath}`, 'error')
        log(`Error code: ${error.code}`, 'error')
        
        // Show helpful error message
        let errorMessage = `Could not start Next.js server.\n\n`
        errorMessage += `Error: ${error.message}\n\n`
        if (error.code === 'ENOENT') {
          errorMessage += `Node.js not found at: ${nodePath}\n\n`
          errorMessage += `Please install Node.js:\n`
          errorMessage += `  brew install node\n\n`
          errorMessage += `Or ensure Node.js is in your PATH.`
        } else {
          errorMessage += `Unexpected error: ${error.code}`
        }
        
        // Try to load a static fallback if available
        const staticPath = join(__dirname, '../.next/static')
        if (fs.existsSync(staticPath)) {
          mainWindow.loadURL('file://' + join(staticPath, 'index.html'))
        } else {
          mainWindow.loadURL('data:text/html,<html><head><style>body{font-family:monospace;padding:20px;background:#000;color:#fff;}</style></head><body><h1>Error: Could not start server</h1><pre>' + encodeURIComponent(errorMessage) + '</pre></body></html>')
        }
      })
      
      // Wait for server to start, with retry logic
      let retries = 0
      const maxRetries = 30 // Increased retries (15 seconds total)
      
      const checkServer = () => {
        const http = require('http')
        const req = http.get('http://localhost:3000', (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            serverReady = true
            log('✓ Server is ready! Loading app...')
            mainWindow.loadURL('http://localhost:3000')
          } else {
            retries++
            if (retries < maxRetries) {
              setTimeout(checkServer, 500)
            } else {
              log(`Server returned non-200 status: ${res.statusCode}`, 'error')
              showError('Server returned error status: ' + res.statusCode)
            }
          }
        })
        req.on('error', (err) => {
          retries++
          log(`Server check attempt ${retries}/${maxRetries}: ${err.message}`)
          if (retries < maxRetries) {
            setTimeout(checkServer, 500)
          } else {
            log('Server failed to start after retries', 'error')
            // Check if process is still running
            let processStatus = 'unknown'
            if (nextProcess) {
              try {
                process.kill(nextProcess.pid, 0) // Check if process exists
                processStatus = 'running'
              } catch (e) {
                processStatus = 'not running (exited)'
              }
            } else {
              processStatus = 'never started'
            }
            
            let errorDetails = `Server failed to start after ${maxRetries} attempts.\n\n`
            errorDetails += `Process status: ${processStatus}\n`
            errorDetails += `Node path: ${nodePath}\n`
            errorDetails += `Server path: ${serverPath}\n`
            errorDetails += `Standalone path: ${nextStandalone}\n\n`
            errorDetails += `Please check the main process console (not this window) for detailed error messages.\n`
            errorDetails += `Common issues:\n`
            errorDetails += `- Node.js not installed (install with: brew install node)\n`
            errorDetails += `- Port 3000 already in use\n`
            errorDetails += `- Server process crashed\n`
            
            showError(errorDetails)
          }
        })
        req.setTimeout(2000, () => {
          req.destroy()
          retries++
          if (retries < maxRetries) {
            setTimeout(checkServer, 500)
          } else {
            log('Server check timeout', 'error')
            showError('Server startup timeout. Check logs below for details.')
          }
        })
      }
      
      // Show loading message while waiting
      mainWindow.loadURL('data:text/html,<html><head><style>body{font-family:monospace;padding:40px;background:#000;color:#fff;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;}</style></head><body><h1>the stash</h1><p>Starting server...</p><p id="status">Please wait</p><script>let dots=0;setInterval(()=>{dots=(dots+1)%4;document.getElementById("status").textContent="Please wait"+". ".repeat(dots)},500)</script></body></html>')
      
      // Start checking after a short delay
      setTimeout(checkServer, 1500)
    } else {
      log('Standalone build not found', 'error')
      log('Checked paths: ' + [
        app.isPackaged ? join(process.resourcesPath, '.next', 'standalone') : join(__dirname, '../.next/standalone'),
        app.isPackaged ? join(process.resourcesPath, 'app', '.next', 'standalone') : null,
        join(__dirname, '.next', 'standalone'),
        join(__dirname, '..', '.next', 'standalone'),
      ].filter(Boolean))
      mainWindow.loadURL('data:text/html,<html><body><h1>Build Error</h1><p>Standalone build not found. Please rebuild the app with BUILD_STANDALONE=true</p><p>Checked: ' + (nextStandalone || 'none') + '</p></body></html>')
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill()
  }
})

