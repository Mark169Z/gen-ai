from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
import subprocess
import os
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
# Static Fonts
# ---------------------------------------------------

app.mount(
    "/generated",
    StaticFiles(directory="generated"),
    name="generated"
)

# ---------------------------------------------------
# Device
# ---------------------------------------------------

device = "cpu"

# ---------------------------------------------------
# Create folders
# ---------------------------------------------------

os.makedirs(
    "./generated/png",
    exist_ok=True
)

os.makedirs(
    "./generated/svg",
    exist_ok=True
)

os.makedirs(
    "./generated/fonts",
    exist_ok=True
)

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

    font = ImageFont.truetype(
        "./fonts/arial.ttf",
        96
    )

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
# Preview + Generate Font
# ---------------------------------------------------

@app.post("/api/preview")
async def preview(
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
    # Load style refs
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

    style_stack = torch.stack(
        style_tensors
    )

    style_stack = style_stack.unsqueeze(0)

    outputs = {}

    # -----------------------------------------
    # Generate PNG glyphs
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

        # -----------------------------------------
        # Save PNG
        # -----------------------------------------

        png_path = (
            f"./generated/png/{char}.png"
        )

        image.save(png_path)

        # -----------------------------------------
        # Base64 preview
        # -----------------------------------------

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

        print(
            f"{char} PNG GENERATED"
        )

    # -----------------------------------------
    # PNG -> SVG
    # -----------------------------------------

    for char in characters:

        png_path = (
            f"./generated/png/{char}.png"
        )

        pgm_path = (
            f"./generated/png/{char}.pgm"
        )

        svg_path = (
            f"./generated/svg/{char}.svg"
        )

        img = Image.open(
            png_path
        ).convert("L")

        img.save(pgm_path)

        subprocess.run([
            r"potrace.exe",
            pgm_path,
            "-s",
            "-o",
            svg_path
        ])

        print(
            f"{char} SVG GENERATED"
        )

    # -----------------------------------------
    # Build FontForge script
    # -----------------------------------------

    fontforge_script = f'''
import fontforge

font = fontforge.font()

font.fontname = "GenAI"
font.familyname = "GenAI"
font.fullname = "GenAI"

characters = "{characters}"

for char in characters:

    glyph = font.createChar(
        ord(char)
    )

    glyph.importOutlines(
        f"./generated/svg/{{char}}.svg"
    )

    glyph.width = 600

font.generate(
    "./generated/fonts/GenAI.ttf"
)

print("FONT GENERATED")
'''

    with open(
        "build_font.py",
        "w",
        encoding="utf-8"
    ) as f:

        f.write(fontforge_script)

    # -----------------------------------------
    # Run FontForge
    # -----------------------------------------

    subprocess.run([
        r"ffpython.exe",
        "build_font.py"
    ])

    print("TTF GENERATED")

    # -----------------------------------------
    # Return previews + font url
    # -----------------------------------------

    return {
        "images": outputs,
        "font_url":
            "http://127.0.0.1:8000/generated/fonts/GenAI.ttf"
    }