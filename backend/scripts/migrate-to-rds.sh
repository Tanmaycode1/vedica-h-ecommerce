#!/bin/bash

# Load environment variables
source .env

# Local database details (from original environment)
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="tanmay0786"
LOCAL_DB_NAME="bigdeal_ecommerce"

# AWS RDS details (from updated environment variables)
RDS_HOST=$DB_HOST
RDS_PORT=$DB_PORT
RDS_USER=$DB_USER
RDS_PASSWORD=$DB_PASSWORD
RDS_DB_NAME=$DB_NAME

echo "Starting migration from local PostgreSQL to AWS RDS..."

# Export the local database
echo "Exporting local database..."
PGPASSWORD=$LOCAL_DB_PASSWORD pg_dump -h $LOCAL_DB_HOST -p $LOCAL_DB_PORT -U $LOCAL_DB_USER -F c -b -v -f backup.dump $LOCAL_DB_NAME

if [ $? -ne 0 ]; then
    echo "Error: Failed to export local database."
    exit 1
fi

echo "Local database exported successfully."

# Create the database on RDS if it doesn't exist
echo "Creating database on RDS if it doesn't exist..."
PGPASSWORD=$RDS_PASSWORD psql -h $RDS_HOST -p $RDS_PORT -U $RDS_USER -c "CREATE DATABASE $RDS_DB_NAME;" postgres

# Import the dump to RDS
echo "Importing database to AWS RDS..."
PGPASSWORD=$RDS_PASSWORD pg_restore -h $RDS_HOST -p $RDS_PORT -U $RDS_USER -d $RDS_DB_NAME -v backup.dump

if [ $? -ne 0 ]; then
    echo "Warning: There were some errors during the import process, but this could be due to constraints or dependencies."
fi

echo "Migration completed. Check the output for any errors."

# Clean up the dump file
echo "Cleaning up..."
rm backup.dump

echo "Migration process finished." 