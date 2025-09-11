#!/bin/bash
set -e

echo "Starting MUN Platform Backend..."

# Seed the database
echo "npm run seed..."
npm run seed

# Start the application
echo "npm run build..."
npm run build