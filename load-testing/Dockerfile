# Load Testing Docker Image
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the load test script
COPY load_test.py .

# Create directories for volume mounts
RUN mkdir -p /app/supabase /app/quiz-app

ENTRYPOINT ["python", "load_test.py"]

# Default arguments (can be overridden)
CMD ["--help"]

