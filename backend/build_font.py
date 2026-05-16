
import fontforge

font = fontforge.font()

# -----------------------------------------
# Font metadata
# -----------------------------------------

font.familyname = "GenAI"

font.fontname = "GenAI-Regular"

font.fullname = "GenAI Regular"

font.weight = "Regular"

font.os2_weight = 400

font.italicangle = 0

# -----------------------------------------
# Font metrics
# -----------------------------------------

font.em = 1000

font.ascent = 800

font.descent = 200

characters = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# -----------------------------------------
# Build glyphs
# -----------------------------------------

for char in characters:

    glyph = font.createChar(
        ord(char)
    )

    glyph.importOutlines(
        f"./generated/svg/{char}.svg"
    )

    # -----------------------------------------
    # Scale glyph down
    # -----------------------------------------

    glyph.transform(
        (0.7, 0, 0, 0.7, 0, 0)
    )

    # -----------------------------------------
    # Cleanup
    # -----------------------------------------

    glyph.removeOverlap()

    glyph.correctDirection()

    glyph.round()

    glyph.autoHint()

    glyph.autoInstr()

    # -----------------------------------------
    # Metrics
    # -----------------------------------------

    glyph.left_side_bearing = 50

    glyph.right_side_bearing = 50

    glyph.width = 1000

# -----------------------------------------
# Generate font
# -----------------------------------------

font.generate(
    "./generated/fonts/GenAI.ttf"
)

print("FONT GENERATED")
