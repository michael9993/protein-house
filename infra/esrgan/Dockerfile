FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (pinned torch 2.4 + torchvision 0.19 for basicsr compatibility)
RUN pip install --no-cache-dir \
    flask==3.1.* \
    Pillow==11.* \
    torch==2.4.* \
    torchvision==0.19.* \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir \
    basicsr==1.4.* \
    gfpgan==1.3.* \
    realesrgan==0.3.*

# Download Real-ESRGAN model weights on build (avoids first-request delay)
RUN mkdir -p /app/weights && \
    wget -q -O /app/weights/RealESRGAN_x4plus.pth \
    "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"

COPY server.py /app/server.py

EXPOSE 7001

CMD ["python", "server.py"]
