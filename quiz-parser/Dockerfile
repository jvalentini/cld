FROM python:3.11-slim

# Set working directory
WORKDIR /work

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies from requirements file
RUN pip install --no-cache-dir --requirement requirements.txt

# Copy the script to /usr/local/bin so it's in PATH
COPY parse_questions.py /usr/local/bin/parse_questions.py
RUN chmod +x /usr/local/bin/parse_questions.py

# Set entrypoint to the script
ENTRYPOINT ["python", "/usr/local/bin/parse_questions.py"]

# Default command shows help
CMD ["--help"]