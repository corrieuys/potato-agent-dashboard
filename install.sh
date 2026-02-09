#!/bin/bash

# Potato Cloud Agent Install Script
# This script installs the Potato Cloud agent with automatic dependency management

set -e

# Configuration
AGENT_VERSION="v1.0.0"
AGENT_BINARY="buildvigil-agent"
AGENT_DIR="/usr/local/bin"
CONFIG_DIR="/etc/buildvigil"
DATA_DIR="/var/lib/buildvigil"
LOG_DIR="/var/log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Check if running as root
script_check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check system requirements
script_check_system() {
    log_info "Checking system requirements..."
    
    # Check OS
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    
    log_info "Operating System: $OS $VER"
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ $ARCH != "x86_64" && $ARCH != "aarch64" ]]; then
        log_warn "Unsupported architecture: $ARCH (x86_64 or aarch64 required)"
    else
        log_info "Architecture: $ARCH"
    fi
    
    # Check minimum RAM
    if [[ -f /proc/meminfo ]]; then
        MEM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
        MEM_MB=$((MEM_KB / 1024))
        if [[ $MEM_MB -lt 1024 ]]; then
            log_warn "Low memory: $MEM_MB MB (1GB+ recommended)"
        else
            log_info "Memory: ${MEM_MB}MB"
        fi
    fi
    
    # Check disk space
    if command -v df && command -v awk && command -v tail &; then
        DISK_FREE=$(df / | tail -1 | awk '{print $4}')
        DISK_FREE_MB=$((DISK_FREE / 1024))
        if [[ $DISK_FREE_MB -lt 5120 ]]; then
            log_warn "Low disk space: ${DISK_FREE_MB}MB (5GB+ recommended)"
        else
            log_info "Free disk space: ${DISK_FREE_MB}MB"
        fi
    fi
    
    # Check if running in a container (optional)
    if [[ -f /proc/1/cgroup ]]; then
        if grep -q "docker" /proc/1/cgroup || grep -q "lxc" /proc/1/cgroup; then
            log_warn "Running in a container - some features may be limited"
        fi
    fi
}

# Check required binaries
script_check_binaries() {
    log_info "Checking required binaries..."
    
    local missing_binaries=()
    local optional_binaries=()
    
    # Required binaries
    for binary in docker ssh-keygen; do
        if command -v $binary > /dev/null 2>&1; then
            log_info "✓ $binary found"
        else
            missing_binaries+=("$binary")
            log_warn "✗ $binary not found"
        fi
    done
    
    # Optional binaries
    for binary in cloudflared; do
        if command -v $binary > /dev/null 2>&1; then
            log_info "✓ Optional $binary found"
        else
            optional_binaries+=("$binary")
            log_warn "✗ Optional $binary not found (feature will be disabled)"
        fi
    done
    
    # Check if running in a container (some binaries may not be available)
    if [[ -f /proc/1/cgroup ]] && (grep -q "docker" /proc/1/cgroup || grep -q "lxc" /proc/1/cgroup); then
        log_warn "Running in a container - some features may be limited"
    fi
    
    # Warn about missing required binaries
    if [[ ${#missing_binaries[@]} -gt 0 ]]; then
        log_error "Missing required binaries: ${missing_binaries[*]}"
        log_error "Install them first or use the --skip-binaries-check flag"
        exit 1
    fi
    
    # Warn about optional binaries
    if [[ ${#optional_binaries[@]} -gt 0 ]]; then
        log_warn "Optional features will be disabled: ${optional_binaries[*]}"
    fi
}

# Install dependencies
script_install_dependencies() {
    log_info "Installing dependencies..."
    
    # Detect package manager
    if command -v apt-get && [[ -f /etc/debian_version ]]; then
        log_info "Detected Debian/Ubuntu system"
        
        # Update package list
        apt-get update -y
        
        # Install required packages
        apt-get install -y curl wget git
        
        # Install optional packages
        if ! command -v docker && [[ ${#missing_binaries[@]} -eq 0 ]]; then
            apt-get install -y docker.io
        fi
        
    elif command -v yum && [[ -f /etc/redhat-release ]]; then
        log_info "Detected RedHat/CentOS system"
        
        # Update package list
        yum update -y
        
        # Install required packages
        yum install -y curl wget git
        
        # Install optional packages
        if ! command -v docker && [[ ${#missing_binaries[@]} -eq 0 ]]; then
            yum install -y docker
        fi
        
    elif command -v pacman && [[ -f /etc/arch-release ]]; then
        log_info "Detected Arch Linux system"
        
        # Update package list
        pacman -Sy --noconfirm
        
        # Install required packages
        pacman -S --noconfirm curl wget git
        
        # Install optional packages
        if ! command -v docker && [[ ${#missing_binaries[@]} -eq 0 ]]; then
            pacman -S --noconfirm docker
        fi
        
    else
        log_warn "Unknown package manager, skipping dependency installation"
    fi
    
    # Ensure docker is running if installed
    if command -v docker && ! docker info > /dev/null 2>&1; then
        log_info "Starting Docker service..."
        if command -v systemctl && systemctl is-active --quiet docker; then
            systemctl restart docker
        elif command -v service && service docker status > /dev/null 2>&1; then
            service docker restart
        fi
    fi
}

# Download and install the agent
script_install_agent() {
    log_info "Downloading and installing BuildVigil agent..."
    
    # Create directories
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$DATA_DIR"
    mkdir -p "$LOG_DIR"
    
    # Download the agent
    local temp_file="/tmp/buildvigil-agent"
    local download_url="https://github.com/buildvigil/agent/releases/download/$AGENT_VERSION/buildvigil-agent"
    
    log_info "Downloading agent from $download_url"
    if ! curl -L -o "$temp_file" "$download_url"; then
        log_error "Failed to download agent"
        exit 1
    fi
    
    # Make executable
    chmod +x "$temp_file"
    
    # Install to /usr/local/bin
    mv "$temp_file" "$AGENT_DIR/$AGENT_BINARY"
    
    # Verify installation
    if ! "$AGENT_DIR/$AGENT_BINARY" -version > /dev/null 2>&1; then
        log_error "Failed to verify agent installation"
        exit 1
    fi
    
    log_success "Agent installed successfully to $AGENT_DIR/$AGENT_BINARY"
}

# Create systemd service
script_create_service() {
    log_info "Creating systemd service..."
    
    local service_file="/etc/systemd/system/buildvigil-agent.service"
    
    cat > "$service_file" << 'EOF'
[Unit]
Description=BuildVigil Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/lib/buildvigil
ExecStart=/usr/local/bin/buildvigil-agent -config /etc/buildvigil/config.json -control-plane https://your-control-plane.workers.dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    if command -v systemctl > /dev/null 2>&1; then
        systemctl daemon-reload
        systemctl enable buildvigil-agent
        log_success "Systemd service created and enabled"
    else
        log_warn "Systemd not available, service will need to be managed manually"
    fi
}

# Print usage
script_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --token <token>         Install token for agent registration"
    echo "  --control-plane <url>  Control plane URL"
    echo "  --skip-binaries-check Skip binary dependency checks"
    echo "  --help                  Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --token abc123 --control-plane https://your-control-plane.workers.dev"
    echo "  $0 --skip-binaries-check"
}

# Main installation function
script_main() {
    local token=""
    local control_plane="https://your-control-plane.workers.dev"
    local skip_binaries_check=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --token)
                token="$2"
                shift 2
                ;;
            --control-plane)
                control_plane="$2"
                shift 2
                ;;
            --skip-binaries-check)
                skip_binaries_check=true
                shift
                ;;
            --help)
                script_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                script_usage
                exit 1
                ;;
        esac
    done
    
    # Check root
    script_check_root
    
    # Show welcome message
    echo "BuildVigil Agent Installer"
    echo "=========================="
    
    # Check system
    script_check_system
    
    # Check binaries unless skipped
    if [[ $skip_binaries_check == false ]]; then
        script_check_binaries
    else
        log_warn "Skipping binary dependency checks"
    fi
    
    # Install dependencies
    script_install_dependencies
    
    # Install agent
    script_install_agent
    
    # Create systemd service
    script_create_service
    
    # Print success message
    log_success "BuildVigil agent installation completed!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your agent:"
    echo "   sudo buildvigil-agent -register $token -control-plane $control-plane"
    echo ""
    echo "2. Start the agent:"
    echo "   sudo systemctl start buildvigil-agent"
    echo "   (or sudo $AGENT_DIR/$AGENT_BINARY -config /etc/buildvigil/config.json -control-plane $control_plane)"
    echo ""
    echo "3. Check status:"
    echo "   sudo buildvigil-agent -status"
    echo ""
    echo "4. View logs:"
    echo "   sudo journalctl -u buildvigil-agent -f"
    echo ""
    echo "Agent configuration will be saved to:"
    echo "   Config: $CONFIG_DIR/config.json"
    echo "   Data: $DATA_DIR/"
    echo "   Logs: $LOG_DIR/"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    script_main "$@"
fi