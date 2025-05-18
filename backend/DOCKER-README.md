# BigDeal Backend - Docker Deployment

This guide explains how to run the BigDeal backend using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Access to the AWS RDS database (credentials are already configured in the docker-compose.yml file)

## Docker Setup

The backend application has been containerized for easy deployment and includes:

- Node.js 18 Alpine as the base image
- Database connection to the AWS RDS instance
- Volume mapping for persistent uploads storage
- Health check endpoint

## Running with Docker Compose

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and start the container:
   ```bash
   docker-compose up -d
   ```

3. View logs:
   ```bash
   docker-compose logs -f
   ```

4. Stop the container:
   ```bash
   docker-compose down
   ```

## Available Endpoints

The API will be available at http://localhost:3002/api

Health check endpoint: http://localhost:3002/health

## Environment Variables

All required environment variables are already configured in the docker-compose.yml file:

- Database connection parameters for RDS
- JWT settings for authentication
- Server configuration

## Handling Uploads

The uploads directory is mounted as a volume to persist files between container restarts. The files will be stored in the `./uploads` directory on your host machine.

## Troubleshooting

If you encounter any issues:

1. Check the container logs:
   ```bash
   docker-compose logs -f
   ```

2. Verify the database connection:
   ```bash
   docker exec -it bigdeal-backend node -e "require('pg').Client({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}).connect()"
   ```

3. Restart the container:
   ```bash
   docker-compose restart
   ``` 