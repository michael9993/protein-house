"""
Real-ESRGAN upscaling server for Image Studio.
Wraps Real-ESRGAN in a simple Flask API.

POST /api/upscale  — Accepts JSON { "image": "<base64>", "scale": 2|3|4 }
                     Returns JSON { "image": "<base64>" }
GET  /health       — Returns { "status": "ok" }
"""

import base64
import io
import os
import sys
import types
import logging

# Compatibility shim: basicsr imports torchvision.transforms.functional_tensor
# which was removed in torchvision 0.17+. Redirect to functional.
import torchvision.transforms.functional as _F
sys.modules["torchvision.transforms.functional_tensor"] = _F

from flask import Flask, request, jsonify
from PIL import Image
import numpy as np

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("esrgan")

# Lazy-load the upsampler to avoid slow startup
_upsampler = {}


def get_upsampler(scale: int):
    """Get or create a Real-ESRGAN upsampler for the given scale."""
    if scale not in _upsampler:
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet

        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )

        model_path = "/app/weights/RealESRGAN_x4plus.pth"

        _upsampler[scale] = RealESRGANer(
            scale=scale,
            model_path=model_path,
            model=model,
            tile=256,  # Process in 256px tiles to limit memory
            tile_pad=10,
            pre_pad=0,
            half=False,  # CPU mode — no half precision
        )
        logger.info(f"Loaded Real-ESRGAN model for scale={scale}")

    return _upsampler[scale]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/upscale", methods=["POST"])
def upscale():
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "Missing 'image' field"}), 400

        scale = data.get("scale", 4)
        if scale not in (2, 3, 4):
            return jsonify({"error": "Scale must be 2, 3, or 4"}), 400

        # Decode base64 image
        image_b64 = data["image"]
        # Strip data URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        logger.info(
            f"Upscaling {img.width}x{img.height} by {scale}x "
            f"(target: {img.width * scale}x{img.height * scale})"
        )

        # Convert to numpy array for Real-ESRGAN
        img_np = np.array(img)

        # Run upscaling
        upsampler = get_upsampler(scale)
        output, _ = upsampler.enhance(img_np, outscale=scale)

        # Convert back to PIL and then to base64
        result_img = Image.fromarray(output)
        buffer = io.BytesIO()
        result_img.save(buffer, format="PNG")
        result_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        logger.info(
            f"Upscaled to {result_img.width}x{result_img.height} "
            f"({len(result_b64) // 1024}KB base64)"
        )

        return jsonify({"image": f"data:image/png;base64,{result_b64}"})

    except Exception as e:
        logger.error(f"Upscale failed: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7001))
    logger.info(f"Starting Real-ESRGAN server on port {port}")
    app.run(host="0.0.0.0", port=port, threaded=True)
