#!/bin/sh
set -e

echo "Starting application..."

# Check if we're in production environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Production environment detected - running Alembic migrations..."
    alembic upgrade head
    echo "Migrations completed successfully"
else
    echo "Development environment - skipping automatic migrations"
    echo "Run 'alembic upgrade head' manually if needed"
fi

# Start the application
echo "Starting uvicorn server..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

