# Use the official Python 3.12 slim image for a lightweight runtime footprint
FROM python:3.12-slim

# Prevent Python from writing .pyc files to disk and ensure console logging outputs instantly
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside the container
WORKDIR /workspace

# Install system utilities needed for building packages (e.g. gcc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies separately to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose the default port specified in settings
EXPOSE 5001

# Run the FastAPI application using uvicorn production server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5001"]
