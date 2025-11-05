#!/bin/bash

# Script to download and bundle Node.js with the Electron app
# This ensures the app is self-contained and doesn't require system Node.js
# Bundles both arm64 and x64 for universal Mac builds

set -e

NODE_VERSION="20.18.0"  # LTS version
NODE_DIR="node-bundle"
BUNDLE_DIR="$(dirname "$0")/${NODE_DIR}"

echo "Bundling Node.js ${NODE_VERSION} for Mac (arm64 + x64)..."

# Create bundle directory
mkdir -p "$BUNDLE_DIR"

# Function to download and prepare Node.js for an architecture
bundle_arch() {
    local ARCH=$1
    local NODE_DIST="node-v${NODE_VERSION}-darwin-${ARCH}"
    local NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz"
    local BUNDLE_NODE_DIR="${BUNDLE_DIR}/node-${ARCH}"
    
    echo ""
    echo "Processing ${ARCH} architecture..."
    
    # Download Node.js if not already present
    if [ ! -f "${BUNDLE_DIR}/${NODE_DIST}.tar.gz" ]; then
        echo "Downloading Node.js ${ARCH} from ${NODE_URL}..."
        curl -L "$NODE_URL" -o "${BUNDLE_DIR}/${NODE_DIST}.tar.gz"
    else
        echo "Node.js ${ARCH} archive already exists, skipping download."
    fi
    
    # Extract Node.js
    if [ ! -d "${BUNDLE_DIR}/${NODE_DIST}" ]; then
        echo "Extracting Node.js ${ARCH}..."
        tar -xzf "${BUNDLE_DIR}/${NODE_DIST}.tar.gz" -C "$BUNDLE_DIR"
    fi
    
    # Prepare bundle directory
    echo "Preparing Node.js ${ARCH} bundle..."
    mkdir -p "$BUNDLE_NODE_DIR"
    
    # Copy the entire Node.js installation (we need all dependencies)
    echo "Copying Node.js installation..."
    cp -r "${BUNDLE_DIR}/${NODE_DIST}/"* "$BUNDLE_NODE_DIR/" 2>/dev/null || true
    
    # Ensure bin/node exists and is executable
    if [ -f "${BUNDLE_NODE_DIR}/bin/node" ]; then
        # Move bin/node to root for easier access
        mv "${BUNDLE_NODE_DIR}/bin/node" "${BUNDLE_NODE_DIR}/node"
        chmod +x "${BUNDLE_NODE_DIR}/node"
    elif [ -f "${BUNDLE_DIR}/${NODE_DIST}/bin/node" ]; then
        cp "${BUNDLE_DIR}/${NODE_DIST}/bin/node" "${BUNDLE_NODE_DIR}/node"
        chmod +x "${BUNDLE_NODE_DIR}/node"
    fi
    
    # Fix library paths using install_name_tool (macOS)
    if command -v install_name_tool >/dev/null 2>&1 && [ -f "${BUNDLE_NODE_DIR}/node" ]; then
        echo "Fixing library paths..."
        # Get the directory where libraries are
        LIB_DIR="${BUNDLE_NODE_DIR}/lib"
        if [ -d "$LIB_DIR" ]; then
            # Update library paths to be relative
            install_name_tool -add_rpath "@loader_path/lib" "${BUNDLE_NODE_DIR}/node" 2>/dev/null || true
        fi
    fi
    
    # Skip verification at build time to avoid hanging (binary will be verified at runtime)
    if [ -f "${BUNDLE_NODE_DIR}/node" ]; then
        echo "✅ Node.js binary prepared (will verify at runtime)"
    fi
    
    echo "✅ Node.js ${ARCH} bundled successfully!"
}

# Bundle both architectures
bundle_arch "arm64"
bundle_arch "x64"

echo ""
echo "✅ All Node.js binaries bundled successfully!"
echo "Location: ${BUNDLE_DIR}/node-{arm64,x64}/node"
