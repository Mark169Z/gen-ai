
import fontforge

font = fontforge.font()

font.fontname = "GenAI"
font.familyname = "GenAI"
font.fullname = "GenAI"

characters = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

for char in characters:

    glyph = font.createChar(
        ord(char)
    )

    glyph.importOutlines(
        f"./generated/svg/{char}.svg"
    )

    glyph.width = 600

font.generate(
    "./generated/fonts/GenAI.ttf"
)

print("FONT GENERATED")
