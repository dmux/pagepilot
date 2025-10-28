# PagePilot VS Code Extension Makefile
# Automates build, test, and deployment processes

.PHONY: help install build test lint clean package publish deploy check-vsce version bump-patch bump-minor bump-major

# Default target
help:
	@echo "PagePilot VS Code Extension - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install      - Install dependencies"
	@echo "  build        - Build the extension"
	@echo "  watch        - Build and watch for changes"
	@echo "  test         - Run tests"
	@echo "  lint         - Run linter"
	@echo "  clean        - Clean build artifacts"
	@echo ""
	@echo "Packaging & Publishing:"
	@echo "  package      - Create .vsix package"
	@echo "  check-vsce   - Check if vsce is installed"
	@echo "  publish      - Publish to VS Code Marketplace"
	@echo "  deploy       - Full deployment (build + test + package + publish)"
	@echo ""
	@echo "Version Management:"
	@echo "  version      - Show current version"
	@echo "  bump-patch   - Bump patch version (0.0.x)"
	@echo "  bump-minor   - Bump minor version (0.x.0)"
	@echo "  bump-major   - Bump major version (x.0.0)"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Build the extension
build:
	@echo "Building extension..."
	npm run compile

# Build and watch for changes
watch:
	@echo "Building and watching for changes..."
	npm run watch

# Run tests
test:
	@echo "Running tests..."
	npm run test

# Run linter
lint:
	@echo "Running linter..."
	npm run lint

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	npm run clean
	rm -f *.vsix

# Create production package
package: clean lint test
	@echo "Creating production package..."
	npm run package

# Check if vsce is installed
check-vsce:
	@which vsce > /dev/null || (echo "vsce not found. Installing..." && npm install -g @vscode/vsce)

# Create .vsix package file
vsix: package check-vsce
	@echo "Creating .vsix package..."
	vsce package

# Publish to VS Code Marketplace
publish: check-vsce
	@echo "Publishing to VS Code Marketplace..."
	@echo "Current version: $$(node -p "require('./package.json').version")"
	@read -p "Are you sure you want to publish? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	vsce publish

# Full deployment pipeline
deploy: clean install lint test package vsix publish
	@echo "✅ Deployment completed successfully!"
	@echo "Extension published to VS Code Marketplace"

# Show current version
version:
	@echo "Current version: $$(node -p "require('./package.json').version")"

# Bump patch version (0.0.x)
bump-patch:
	@echo "Bumping patch version..."
	npm version patch --no-git-tag-version
	@echo "New version: $$(node -p "require('./package.json').version")"

# Bump minor version (0.x.0)
bump-minor:
	@echo "Bumping minor version..."
	npm version minor --no-git-tag-version
	@echo "New version: $$(node -p "require('./package.json').version")"

# Bump major version (x.0.0)
bump-major:
	@echo "Bumping major version..."
	npm version major --no-git-tag-version
	@echo "New version: $$(node -p "require('./package.json').version")"

# Quick development workflow
dev: install build test
	@echo "✅ Development setup completed!"

# Pre-publish checks
pre-publish: clean install lint test package
	@echo "✅ Pre-publish checks completed!"
	@echo "Ready to publish version: $$(node -p "require('./package.json').version")"

# Install vsce globally if not present
install-vsce:
	@echo "Installing vsce globally..."
	npm install -g @vscode/vsce

# Show package info
info:
	@echo "Package Information:"
	@echo "Name: $$(node -p "require('./package.json').name")"
	@echo "Version: $$(node -p "require('./package.json').version")"
	@echo "Publisher: $$(node -p "require('./package.json').publisher")"
	@echo "Description: $$(node -p "require('./package.json').description")"