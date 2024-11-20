#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository information
REPO="vitalygashkov/streamyx"
GITHUB_API="https://api.github.com/repos/$REPO/releases/latest"

print_message() {
    echo -e "${BLUE}==>${NC} $1"
}

get_latest_version() {
    curl -sL $GITHUB_API | grep '"tag_name":' | cut -d'"' -f4
}

get_os() {
    case "$(uname -s)" in
        Darwin*)  echo "mac";;
        Linux*)   echo "linux";;
        *)        echo "unknown";;
    esac
}

get_arch() {
    local arch=$(uname -m)
    case "$arch" in
        x86_64)  echo "x64";;
        amd64)   echo "x64";;
        arm64)   echo "arm64";;
        aarch64) echo "arm64";;
        *)       echo "unknown";;
    esac
}

download_and_install() {
    local os=$(get_os)
    local arch=$(get_arch)
    local version=$(get_latest_version)

    if [ "$os" = "unknown" ] || [ "$arch" = "unknown" ]; then
        echo -e "${RED}Error: Unsupported operating system or architecture${NC}"
        exit 1
    fi

    local filename="streamyx-${arch}-${os}.zip"
    local download_url="https://github.com/$REPO/releases/download/${version}/${filename}"

    print_message "Downloading Streamyx ${version} for ${os}-${arch}..."

    # Create temporary directory
    local tmp_dir=$(mktemp -d)
    curl -sL "$download_url" -o "$tmp_dir/$filename"

    print_message "Extracting..."
    unzip -q "$tmp_dir/$filename" -d "$tmp_dir"

    print_message "Installing..."
    chmod +x "$tmp_dir/streamyx"
    "$tmp_dir/streamyx" install

    print_message "Cleaning up..."
    rm -rf "$tmp_dir"

    echo -e "${GREEN}Streamyx has been successfully installed!${NC}"
}

# Run the installation
download_and_install
