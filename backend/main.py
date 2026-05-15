from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from torchvision.transforms.functional import to_pil_image
from torchvision import transforms

from PIL import (
    Image,
    ImageDraw,
    ImageFont,
)

from models import Generator

from typing import List, Annotated

import torch
import io
import base64

# ---------------------------------------------------
# App
# ---------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# Device
# ---------------------------------------------------

device = "cpu"

# ---------------------------------------------------
# Load model
# ---------------------------------------------------

checkpoint = torch.load(
    "./.pt/latest.pt",
    map_location=device
)

model = Generator(
    image_channels=1,
    base=64,
    depth=4,
    style_dim=256,
)

model.load_state_dict(
    checkpoint["G_ema"]
)

model.eval()

print("MODEL LOADED")

# ---------------------------------------------------
# Transform
# ---------------------------------------------------

transform = transforms.Compose([
    transforms.Grayscale(),
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

# ---------------------------------------------------
# Render character
# ---------------------------------------------------

def render_character(char: str):

    img = Image.new(
        "L",
        (128, 128),
        color=255
    )

    draw = ImageDraw.Draw(img)

    # IMPORTANT:
    # use real TTF font

    font = ImageFont.truetype(
        "./fonts/arial.ttf",
        96
    )

    # proper bbox positioning

    bbox = draw.textbbox(
        (0, 0),
        char,
        font=font
    )

    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]

    x = (128 - w) // 2 - bbox[0]
    y = (128 - h) // 2 - bbox[1]

    draw.text(
        (x, y),
        char,
        fill=0,
        font=font
    )

    return img

# ---------------------------------------------------
# Health
# ---------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "ok"
    }

# ---------------------------------------------------
# Transfer
# ---------------------------------------------------

@app.post("/api/transfer")
async def transfer(
    characters: Annotated[
        str,
        Form()
    ],
    style_files: Annotated[
        List[UploadFile],
        File()
    ]
):

    # -----------------------------------------
    # Load style images
    # -----------------------------------------

    style_tensors = []

    for file in style_files:

        image = Image.open(
            file.file
        ).convert("L")

        tensor = transform(image)

        style_tensors.append(
            tensor
        )

    # (K,1,128,128)

    style_stack = torch.stack(
        style_tensors
    )

    # (1,K,1,128,128)

    style_stack = style_stack.unsqueeze(0)

    outputs = {}

    # -----------------------------------------
    # Generate characters
    # -----------------------------------------

    for char in characters:

        content_img = render_character(
            char
        )

        content_tensor = transform(
            content_img
        )

        content_tensor = (
            content_tensor.unsqueeze(0)
        )

        with torch.no_grad():

            fake = model(
                content_tensor,
                style_stack
            )

        fake = fake.squeeze(0)

        fake = (fake + 1) / 2

        fake = fake.clamp(0, 1)

        image = to_pil_image(fake)

        buffer = io.BytesIO()

        image.save(
            buffer,
            format="PNG"
        )

        buffer.seek(0)

        encoded = base64.b64encode(
            buffer.getvalue()
        ).decode()

        outputs[char] = encoded

    return outputs