#!/usr/bin/env python3
"""Paytm Neighbourhood — 7-slide hackathon pitch deck (Team Panther)."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

ROOT = "/Users/ankitkumar/Desktop/Paytm-Merchant-Growth-AI"
ASSETS = os.path.join(ROOT, "assets")
SCREENS = os.path.join(ASSETS, "screens")
OUT = os.path.join(ROOT, "out", "Paytm_Neighbourhood_Team_Panther.pptx")

BLUE = RGBColor(0x00, 0xBA, 0xF2)
NAVY = RGBColor(0x00, 0x29, 0x70)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BG = RGBColor(0xF3, 0xF9, 0xFC)
SOFT = RGBColor(0xE7, 0xF6, 0xFC)
TEXT = RGBColor(0x0F, 0x27, 0x44)
MUTED = RGBColor(0x5B, 0x70, 0x8B)
LINE = RGBColor(0xCD, 0xE3, 0xF0)
ORANGE = RGBColor(0xFF, 0x70, 0x43)
GREEN = RGBColor(0x0A, 0x7A, 0x4B)

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 7


def run_style(run, size, bold=False, color=TEXT, name="Arial"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name


def textbox(slide, l, t, w, h, text, size=16, bold=False, color=TEXT, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    run_style(r, size, bold, color)
    return box


def multilines(slide, l, t, w, h, lines, size=14, bold=False, color=TEXT, gap=0.08):
    """lines: list of strings; rendered as separate paragraphs."""
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(gap * 72)
        r = p.add_run()
        r.text = line
        run_style(r, size, bold, color)
    return box


def shape(slide, st, l, t, w, h, fill, line=None):
    s = slide.shapes.add_shape(st, l, t, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1)
    return s


def rect(slide, l, t, w, h, fill, line=None):
    return shape(slide, MSO_SHAPE.RECTANGLE, l, t, w, h, fill, line)


def round_rect(slide, l, t, w, h, fill, line=None):
    s = shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h, fill, line)
    try:
        s.adjustments[0] = 0.1
    except Exception:
        pass
    return s


def bg(slide):
    rect(slide, 0, 0, W, H, WHITE)
    rect(slide, 0, 0, W, Inches(0.08), BLUE)


def footer(slide, n):
    rect(slide, 0, Inches(7.15), W, Inches(0.35), BG)
    textbox(
        slide,
        Inches(0.55),
        Inches(7.18),
        Inches(8),
        Inches(0.28),
        "Team Panther  ·  Paytm Merchant Growth AI  ·  Neighbourhood",
        size=11,
        color=MUTED,
    )
    textbox(
        slide,
        Inches(11.2),
        Inches(7.18),
        Inches(1.6),
        Inches(0.28),
        f"{n} / {TOTAL}",
        size=11,
        color=MUTED,
        align=PP_ALIGN.RIGHT,
    )


def add_pic(slide, path, l, t, width=None, height=None):
    if not os.path.exists(path):
        return None
    if width and height:
        return slide.shapes.add_picture(path, l, t, width=width, height=height)
    if width:
        return slide.shapes.add_picture(path, l, t, width=width)
    if height:
        return slide.shapes.add_picture(path, l, t, height=height)
    return slide.shapes.add_picture(path, l, t, width=Inches(6))


def pic_frame(slide, path, l, t, w, h):
    """Soft frame behind a screenshot."""
    round_rect(slide, l - Inches(0.06), t - Inches(0.06), w + Inches(0.12), h + Inches(0.12), SOFT, LINE)
    return add_pic(slide, path, l, t, width=w, height=h)


def kicker(slide, text, l=Inches(0.65), t=Inches(0.32)):
    textbox(slide, l, t, Inches(4), Inches(0.28), text, size=12, bold=True, color=BLUE)


# ——— Slides ———


def slide_1(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 1)
    rect(s, 0, Inches(0.08), Inches(5.9), Inches(7.07), NAVY)

    textbox(s, Inches(0.7), Inches(1.1), Inches(4.6), Inches(0.35), "TEAM PANTHER", size=13, bold=True, color=BLUE)
    textbox(s, Inches(0.7), Inches(1.7), Inches(4.8), Inches(1.3), "Paytm\nNeighbourhood", size=40, bold=True, color=WHITE)
    textbox(
        s,
        Inches(0.7),
        Inches(3.4),
        Inches(4.6),
        Inches(1.0),
        "Street map. Nearby rivals.\nIdle stock → today’s EDI.",
        size=20,
        bold=True,
        color=WHITE,
    )
    textbox(
        s,
        Inches(0.7),
        Inches(4.7),
        Inches(4.6),
        Inches(1.0),
        "A simple co-pilot for kirana merchants:\nsee the street, move slow stock, pay the daily cut.",
        size=14,
        color=RGBColor(0xC8, 0xE8, 0xF8),
    )
    round_rect(s, Inches(0.7), Inches(6.0), Inches(4.4), Inches(0.55), BLUE)
    textbox(s, Inches(0.85), Inches(6.1), Inches(4.1), Inches(0.4), "Hackathon demo · live product", size=14, bold=True, color=WHITE)

    img = os.path.join(SCREENS, "01-landing.png")
    pic_frame(s, img, Inches(6.3), Inches(1.15), Inches(6.5), Inches(5.35))


def slide_2(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 2)
    kicker(s, "THE PROBLEM")
    textbox(s, Inches(0.65), Inches(0.65), Inches(12), Inches(0.5), "Cash is stuck on the shelf. EDI still falls due.", size=26, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.65),
        Inches(1.2),
        Inches(12),
        Inches(0.4),
        "Kirana merchants feel three pains every day — and they are connected.",
        size=15,
        color=MUTED,
    )

    cards = [
        ("01", "Blind on the street", "Hard to see who lives nearby, which rival is winning, and what to stock this week."),
        ("02", "Idle stock = locked cash", "Slow and near-expiry SKUs sit for weeks while working capital stays frozen."),
        ("03", "EDI pressure", "Paytm daily loan cut still hits settlement — even when shelves are full of the wrong stock."),
    ]
    for i, (num, title, body) in enumerate(cards):
        left = Inches(0.65 + i * 4.15)
        round_rect(s, left, Inches(1.9), Inches(3.95), Inches(4.6), WHITE, LINE)
        rect(s, left, Inches(1.9), Inches(3.95), Inches(0.9), BLUE if i < 2 else NAVY)
        textbox(s, left + Inches(0.3), Inches(2.1), Inches(3.3), Inches(0.5), num, size=22, bold=True, color=WHITE)
        textbox(s, left + Inches(0.3), Inches(3.15), Inches(3.35), Inches(0.7), title, size=18, bold=True, color=NAVY)
        textbox(s, left + Inches(0.3), Inches(4.0), Inches(3.35), Inches(2.0), body, size=15, color=MUTED)


def slide_3(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 3)
    kicker(s, "THE SOLUTION")
    textbox(s, Inches(0.65), Inches(0.65), Inches(12), Inches(0.5), "Neighbourhood — three steps, one board", size=26, bold=True, color=NAVY)

    pillars = [
        ("Pin the shop", "Login as kirana → allow location → map opens on your street."),
        ("Read the street", "People nearby, households, rivals on a live map — what to watch this week."),
        ("Cover today’s EDI", "Sell idle stock to nearby buyers. Cash from the deal pays the daily cut before settlement."),
    ]
    for i, (title, body) in enumerate(pillars):
        y = Inches(1.4 + i * 1.55)
        round_rect(s, Inches(0.65), y, Inches(6.3), Inches(1.4), WHITE, LINE)
        oval = shape(s, MSO_SHAPE.OVAL, Inches(0.9), y + Inches(0.35), Inches(0.7), Inches(0.7), BLUE)
        textbox(s, Inches(0.9), y + Inches(0.48), Inches(0.7), Inches(0.45), str(i + 1), size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        textbox(s, Inches(1.85), y + Inches(0.3), Inches(4.8), Inches(0.4), title, size=18, bold=True, color=NAVY)
        textbox(s, Inches(1.85), y + Inches(0.75), Inches(4.8), Inches(0.5), body, size=14, color=MUTED)

    img = os.path.join(SCREENS, "02-setup-shop.png")
    pic_frame(s, img, Inches(7.3), Inches(1.45), Inches(5.4), Inches(5.1))


def slide_4(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 4)
    kicker(s, "DEMO LOGIN")
    textbox(s, Inches(0.65), Inches(0.65), Inches(12), Inches(0.45), "Anyone can try it in under a minute", size=26, bold=True, color=NAVY)

    # credential strip
    round_rect(s, Inches(0.65), Inches(1.25), Inches(12.0), Inches(0.85), SOFT, LINE)
    textbox(s, Inches(0.95), Inches(1.35), Inches(11.4), Inches(0.3), "Demo account", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.95),
        Inches(1.65),
        Inches(11.4),
        Inches(0.35),
        "Mobile  1122334455     ·     OTP  123456     ·     then Allow location (or use demo pin)",
        size=16,
        bold=True,
        color=NAVY,
    )

    left = os.path.join(SCREENS, "03-otp.png")
    right = os.path.join(SCREENS, "04-location-popup.png")
    pic_frame(s, left, Inches(0.65), Inches(2.35), Inches(5.9), Inches(4.35))
    pic_frame(s, right, Inches(6.8), Inches(2.35), Inches(5.9), Inches(4.35))


def slide_5(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 5)
    kicker(s, "STREET MAP")
    textbox(s, Inches(0.55), Inches(0.6), Inches(6), Inches(0.45), "Your shop on a live street map", size=24, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.55),
        Inches(1.05),
        Inches(5.8),
        Inches(0.9),
        "Catchment rings, rival pins, and a clear view of who is close. Map opens by default after login.",
        size=14,
        color=MUTED,
    )

    bullets = [
        "·  Your pin + 0.5–2 km rings",
        "·  Nearby rivals with threat level",
        "·  Tap a rival for what to copy / beat",
        "·  Streets · Radar · Satellite views",
    ]
    multilines(s, Inches(0.55), Inches(2.1), Inches(5.5), Inches(2.5), bullets, size=16, color=TEXT)

    round_rect(s, Inches(0.55), Inches(4.6), Inches(5.5), Inches(1.9), NAVY)
    textbox(s, Inches(0.8), Inches(4.85), Inches(5.0), Inches(0.35), "Why judges care", size=14, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.8),
        Inches(5.3),
        Inches(5.0),
        Inches(1.0),
        "Merchants finally see their neighbourhood — not only yesterday’s bill book.",
        size=15,
        color=WHITE,
    )

    img = os.path.join(SCREENS, "05-map.png")
    pic_frame(s, img, Inches(6.4), Inches(1.15), Inches(6.4), Inches(5.5))


def slide_6(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 6)
    kicker(s, "HERO FEATURE")
    textbox(s, Inches(0.55), Inches(0.55), Inches(12), Inches(0.4), "Cover today’s Paytm EDI from idle stock", size=24, bold=True, color=NAVY)

    steps = [
        ("1", "Pick stock", "Highest unlock first"),
        ("2", "Match buyer", "Nearby shops / PGs"),
        ("3", "Confirm sale", "Cash covers EDI days"),
    ]
    for i, (n, title, hint) in enumerate(steps):
        left = Inches(0.55 + i * 2.85)
        round_rect(s, left, Inches(1.1), Inches(2.7), Inches(1.05), WHITE, LINE)
        textbox(s, left + Inches(0.15), Inches(1.2), Inches(0.4), Inches(0.35), n, size=16, bold=True, color=BLUE)
        textbox(s, left + Inches(0.55), Inches(1.22), Inches(2.0), Inches(0.35), title, size=14, bold=True, color=NAVY)
        textbox(s, left + Inches(0.55), Inches(1.55), Inches(2.0), Inches(0.35), hint, size=12, color=MUTED)

    # highlight chip
    round_rect(s, Inches(9.2), Inches(1.15), Inches(3.5), Inches(0.95), NAVY)
    textbox(s, Inches(9.4), Inches(1.3), Inches(3.1), Inches(0.3), "Live orders animation", size=13, bold=True, color=BLUE)
    textbox(s, Inches(9.4), Inches(1.6), Inches(3.1), Inches(0.35), "Packets fly to nearby buyers", size=12, color=WHITE)

    left = os.path.join(SCREENS, "06-inventory-edi.png")
    right = os.path.join(SCREENS, "07-orders-match.png")
    pic_frame(s, left, Inches(0.45), Inches(2.4), Inches(6.15), Inches(4.3))
    pic_frame(s, right, Inches(6.8), Inches(2.4), Inches(6.0), Inches(4.3))


def slide_7(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 7)
    kicker(s, "TRY IT NOW")
    textbox(s, Inches(0.65), Inches(0.65), Inches(12), Inches(0.45), "One smooth demo path", size=26, bold=True, color=NAVY)

    flow = [
        ("1", "Open the site", "Landing → Start setup"),
        ("2", "Kirana + store", "Default kirana · pick Ankit Kirana"),
        ("3", "Login", "1122334455 · OTP 123456"),
        ("4", "Allow location", "Or continue with demo pin"),
        ("5", "Map opens", "See rivals on your street"),
        ("6", "Inventory → Cover EDI", "Sell stock · watch live orders"),
    ]
    for i, (n, title, body) in enumerate(flow):
        col = i % 3
        row = i // 3
        left = Inches(0.65 + col * 4.15)
        top = Inches(1.35 + row * 2.15)
        round_rect(s, left, top, Inches(3.95), Inches(1.9), WHITE, LINE)
        shape(s, MSO_SHAPE.OVAL, left + Inches(0.25), top + Inches(0.35), Inches(0.55), Inches(0.55), BLUE)
        textbox(s, left + Inches(0.25), top + Inches(0.45), Inches(0.55), Inches(0.4), n, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        textbox(s, left + Inches(1.0), top + Inches(0.4), Inches(2.7), Inches(0.4), title, size=16, bold=True, color=NAVY)
        textbox(s, left + Inches(1.0), top + Inches(0.9), Inches(2.7), Inches(0.7), body, size=13, color=MUTED)

    round_rect(s, Inches(0.65), Inches(5.75), Inches(12.0), Inches(1.05), NAVY)
    textbox(
        s,
        Inches(0.95),
        Inches(5.9),
        Inches(8.5),
        Inches(0.35),
        "Paytm Neighbourhood  ·  Team Panther",
        size=16,
        bold=True,
        color=WHITE,
    )
    textbox(
        s,
        Inches(0.95),
        Inches(6.3),
        Inches(10.5),
        Inches(0.35),
        "Street intelligence + inventory exchange that pays today’s EDI.",
        size=14,
        color=RGBColor(0xC8, 0xE8, 0xF8),
    )


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    slide_1(prs)
    slide_2(prs)
    slide_3(prs)
    slide_4(prs)
    slide_5(prs)
    slide_6(prs)
    slide_7(prs)
    prs.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
