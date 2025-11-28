FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir docx2python click

# Copy the script
COPY parse_questions.py .

# Make script executable
RUN chmod +x parse_questions.py

# Create a data directory with wide permissions
# This allows any user to write to it when mounted
RUN mkdir -p /data && chmod 777 /data

# Set entrypoint to the script
ENTRYPOINT ["python", "parse_questions.py"]

# Default command shows usage
CMD ["--help"]