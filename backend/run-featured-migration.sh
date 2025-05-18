#!/bin/bash

echo "Running is_featured migration and setting featured products..."

# Run the migration
echo "Step 1: Running the migration..."
npx knex migrate:latest --knexfile ./src/db/knexfile.js

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo "Migration successful!"
else
  echo "Migration failed! Exiting..."
  exit 1
fi

# Run the script to set featured products
echo "Step 2: Setting featured products..."
node set-featured-products.js

echo "Process completed." 