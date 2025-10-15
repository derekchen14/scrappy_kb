FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]