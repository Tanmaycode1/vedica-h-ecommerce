#!/bin/bash

# Reset and seed database for bigdeal e-commerce
echo "Resetting database..."

# Check if node is available
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed or not in PATH"
  exit 1
fi

# Log environment settings to help with debugging
echo "Database settings:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo "SSL: $DB_SSL"

# Run node script to drop all tables
node reset-db.js

# Check if node script was successful
if [ $? -eq 0 ]; then
  echo "Database reset successful"
  
  # Run migrations
  echo "Running migrations..."
  npm run migrate:latest
  
  # Check if migrations were successful
  if [ $? -eq 0 ]; then
    echo "Migrations successful"
    
    # Run seeds only once
    echo "Running seeds..."
    npm run seed
    
    # Check if seeds were successful
    if [ $? -eq 0 ]; then
      echo "Database setup complete!"
      echo "✅ Migrations and seeds have been successfully applied"
    else
      echo "❌ Seed failed"
      exit 1
    fi
  else
    echo "❌ Migrations failed"
    exit 1
  fi
else
  echo "❌ Database reset failed"
  exit 1
fi 