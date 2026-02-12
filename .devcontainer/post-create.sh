#!/bin/bash
set -e

echo "=== SAP Connect: Setting up development environment ==="

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Install SAP CDS development kit globally
echo "Installing @sap/cds-dk globally..."
npm install -g @sap/cds-dk

# Install CF CLI (for BTP deployment later)
echo "Installing Cloud Foundry CLI..."
if ! command -v cf &> /dev/null; then
  curl -sL "https://packages.cloudfoundry.org/stable?release=linux64-binary&version=v8&source=github" | tar -zx -C /tmp
  sudo mv /tmp/cf8 /usr/local/bin/cf
  sudo chmod +x /usr/local/bin/cf
fi

# Install UI5 CLI
echo "Installing UI5 CLI..."
npm install -g @ui5/cli

echo ""
echo "=== Setup complete! ==="
echo "Run 'npm run watch' to start the CAP server on port 4004"
echo "Run 'npm run discover' to try the API Discovery tool"
