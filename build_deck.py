#!/usr/bin/env python3
"""Paytm Neighbourhood — 6-slide hackathon pitch deck (Team Panther)."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

ROOT = "/Users/ankitkumar/Desktop/Paytm-Merchant-Growth-AI"
ASSETS = os.path.join(ROOT, "assets")
SCREENS = os.path.join(ASSETS, "screens")
OUT = os.path.join(ROOT, "out", "Paytm_Neighbourhood_Team_Panther.pptx")

BLUE = RGBColor(0x00, 0xBA, 0xF2)
NAVY = RGBColor(0x00, 0x29, 0x70)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BG = RGBColor(0xF5, 0xF9, 0xFC)
SOFT = RGBColor(0xEA, 0xF5, 0xFB)
TEXT = RGBColor(0x1A, 0x2F, 0x4A)
MUTED = RGBColor(0x6B, 0x7F, 0x96)
LINE = RGBColor(0xD4, 0xE6, 0xF0)
GREEN = RGBColor(0x0A, 0x7A, 0x4B)

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 6
FONT = "Calibri"


def run_style(run, size, bold=False, color=TEXT, name=FONT):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = name


def textbox(slide, l, t, w, h, text, size=15, bold=False, color=TEXT, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    run_style(r, size, bold, color)
    return box


def multilines(slide, l, t, w, h, lines, size=14, bold=False, color=TEXT, gap=0.1):
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
        s.adjustments[0] = 0.08
    except Exception:
        pass
    return s


def bg(slide):
    rect(slide, 0, 0, W, H, WHITE)
    rect(slide, 0, 0, W, Inches(0.06), BLUE)


def footer(slide, n):
    rect(slide, 0, Inches(7.2), W, Inches(0.3), BG)
    textbox(
        slide,
        Inches(0.55),
        Inches(7.22),
        Inches(8),
        Inches(0.24),
        "Team Panther  ·  Paytm Merchant Growth AI",
        size=10,
        color=MUTED,
    )
    textbox(
        slide,
        Inches(11.3),
        Inches(7.22),
        Inches(1.5),
        Inches(0.24),
        f"{n} / {TOTAL}",
        size=10,
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
    round_rect(slide, l - Inches(0.05), t - Inches(0.05), w + Inches(0.1), h + Inches(0.1), SOFT, LINE)
    return add_pic(slide, path, l, t, width=w, height=h)


def kicker(slide, text, l=Inches(0.6), t=Inches(0.28)):
    textbox(slide, l, t, Inches(5), Inches(0.26), text, size=11, color=BLUE)


# ——— Slides ———


def slide_1(prs):
    """Title — keep the strong first page."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 1)
    rect(s, 0, Inches(0.06), Inches(5.7), Inches(7.14), NAVY)

    textbox(s, Inches(0.7), Inches(1.25), Inches(4.4), Inches(0.3), "TEAM PANTHER", size=12, color=BLUE)
    textbox(s, Inches(0.7), Inches(1.85), Inches(4.6), Inches(1.2), "Paytm\nNeighbourhood", size=36, bold=True, color=WHITE)
    textbox(
        s,
        Inches(0.7),
        Inches(3.4),
        Inches(4.4),
        Inches(0.9),
        "Street map. Nearby rivals.\nIdle stock → today’s EDI.",
        size=18,
        color=WHITE,
    )
    textbox(
        s,
        Inches(0.7),
        Inches(4.6),
        Inches(4.4),
        Inches(0.9),
        "A simple co-pilot for kirana merchants:\nsee the street, move slow stock, pay the daily cut.",
        size=13,
        color=RGBColor(0xB8, 0xDE, 0xF2),
    )
    round_rect(s, Inches(0.7), Inches(5.85), Inches(4.2), Inches(0.5), BLUE)
    textbox(s, Inches(0.85), Inches(5.95), Inches(3.9), Inches(0.35), "Hackathon demo · live product", size=13, color=WHITE)

    img = os.path.join(SCREENS, "01-landing.png")
    pic_frame(s, img, Inches(6.15), Inches(1.1), Inches(6.55), Inches(5.4))


def slide_2(prs):
    """Three problems we solve."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 2)
    kicker(s, "WHAT WE SOLVE")
    textbox(s, Inches(0.6), Inches(0.58), Inches(12), Inches(0.45), "Three pains every kirana feels", size=26, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.6),
        Inches(1.1),
        Inches(12),
        Inches(0.35),
        "Blind on the street · cash locked in idle stock · EDI still due at settlement.",
        size=14,
        color=MUTED,
    )

    cards = [
        ("01", "Don’t know the street", "Who lives nearby, which rival is winning, and what buyers care about this week."),
        ("02", "Stock sits, cash freezes", "Slow movers and near-expiry SKUs lock working capital while shelves look full."),
        ("03", "EDI still hits daily", "Paytm’s daily loan cut falls due even when the wrong stock is sitting idle."),
    ]
    for i, (num, title, body) in enumerate(cards):
        left = Inches(0.6 + i * 4.15)
        round_rect(s, left, Inches(1.75), Inches(3.95), Inches(4.85), WHITE, LINE)
        rect(s, left, Inches(1.75), Inches(3.95), Inches(0.08), BLUE if i < 2 else NAVY)
        textbox(s, left + Inches(0.35), Inches(2.15), Inches(3.2), Inches(0.4), num, size=20, color=BLUE)
        textbox(s, left + Inches(0.35), Inches(2.85), Inches(3.25), Inches(0.7), title, size=18, bold=True, color=NAVY)
        textbox(s, left + Inches(0.35), Inches(3.75), Inches(3.25), Inches(2.2), body, size=14, color=MUTED)


def slide_3(prs):
    """Dashboard + map — know your streets."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 3)
    kicker(s, "STREET INTELLIGENCE")
    textbox(s, Inches(0.55), Inches(0.55), Inches(12), Inches(0.4), "Help the merchant know their streets", size=24, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.55),
        Inches(0.98),
        Inches(12),
        Inches(0.3),
        "Live dashboard + map — people nearby, households, rivals, and what to watch this week.",
        size=13,
        color=MUTED,
    )

    overview = os.path.join(SCREENS, "deck-overview.png")
    mmap = os.path.join(SCREENS, "deck-map.png")
    pic_frame(s, overview, Inches(0.45), Inches(1.45), Inches(6.15), Inches(5.15))
    pic_frame(s, mmap, Inches(6.8), Inches(1.45), Inches(6.05), Inches(5.15))

    # small labels under frames
    textbox(s, Inches(0.5), Inches(6.7), Inches(6), Inches(0.28), "Overview — catchment, rivals, weekly demand", size=11, color=MUTED)
    textbox(s, Inches(6.85), Inches(6.7), Inches(6), Inches(0.28), "Map — your pin, rings, rival ratings on the street", size=11, color=MUTED)


def slide_4(prs):
    """Inventory exchange + EDI."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 4)
    kicker(s, "INVENTORY EXCHANGE · EDI")
    textbox(s, Inches(0.55), Inches(0.52), Inches(7), Inches(0.4), "Move stock before it expires — cover EDI", size=22, bold=True, color=NAVY)

    points = [
        "Match demand on the street — sell idle / near-expiry SKUs to nearby shops.",
        "Cash from the deal pays today’s Paytm EDI cut before settlement.",
        "One flow: pick stock → match buyer → raise cash → EDI covered.",
    ]
    multilines(s, Inches(0.55), Inches(1.0), Inches(6.2), Inches(1.5), [f"·  {p}" for p in points], size=13, color=TEXT, gap=0.12)

    steps = [
        ("1", "Pick stock", "Highest unlock"),
        ("2", "Match buyer", "Nearby demand"),
        ("3", "Cover EDI", "Daily cut paid"),
    ]
    for i, (n, title, hint) in enumerate(steps):
        left = Inches(0.55 + i * 2.15)
        round_rect(s, left, Inches(2.55), Inches(2.05), Inches(0.85), WHITE, LINE)
        textbox(s, left + Inches(0.12), Inches(2.65), Inches(0.35), Inches(0.3), n, size=14, bold=True, color=BLUE)
        textbox(s, left + Inches(0.45), Inches(2.65), Inches(1.5), Inches(0.28), title, size=12, bold=True, color=NAVY)
        textbox(s, left + Inches(0.45), Inches(2.95), Inches(1.5), Inches(0.28), hint, size=11, color=MUTED)

    round_rect(s, Inches(0.55), Inches(3.6), Inches(6.2), Inches(3.0), NAVY)
    textbox(s, Inches(0.8), Inches(3.85), Inches(5.7), Inches(0.3), "Why EDI is the hero", size=13, color=BLUE)
    multilines(
        s,
        Inches(0.8),
        Inches(4.3),
        Inches(5.7),
        Inches(2.0),
        [
            "Merchants already trust Paytm for daily settlement.",
            "Neighbourhood turns idle inventory into cash that",
            "pays the EDI cut — before the cut hits.",
            "",
            "Stock exchange based on real nearby demand,",
            "not guesswork.",
        ],
        size=13,
        color=WHITE,
        gap=0.06,
    )

    img = os.path.join(SCREENS, "deck-inventory.png")
    pic_frame(s, img, Inches(7.0), Inches(1.15), Inches(5.85), Inches(5.5))


def slide_5(prs):
    """How merchant life gets easier."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 5)
    kicker(s, "MERCHANT LIFE")
    textbox(s, Inches(0.6), Inches(0.55), Inches(12), Inches(0.4), "How this makes their day easier", size=24, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.6),
        Inches(1.05),
        Inches(12),
        Inches(0.3),
        "Less guessing. Less dead stock. Less EDI stress.",
        size=14,
        color=MUTED,
    )

    items = [
        ("See the street", "Open the map — know rivals, ratings, and who is close. No more flying blind."),
        ("Know what to stock", "Catchment, households, and weekly demand in one overview — stock for real buyers."),
        ("Unlock cash fast", "Sell slow / near-expiry stock to nearby shops before it dies on the shelf."),
        ("Pay EDI calmly", "Deal cash covers today’s Paytm EDI cut — settlement without panic."),
        ("One simple board", "Login → map → Cover EDI. Built for kirana pace, not analyst dashboards."),
        ("Ask when stuck", "Voice / chat for plain answers on EDI and stock — in the merchant’s words."),
    ]
    for i, (title, body) in enumerate(items):
        col = i % 3
        row = i // 3
        left = Inches(0.55 + col * 4.2)
        top = Inches(1.6 + row * 2.5)
        round_rect(s, left, top, Inches(4.0), Inches(2.2), WHITE, LINE)
        shape(s, MSO_SHAPE.OVAL, left + Inches(0.3), top + Inches(0.35), Inches(0.45), Inches(0.45), BLUE)
        textbox(
            s,
            left + Inches(0.3),
            top + Inches(0.42),
            Inches(0.45),
            Inches(0.35),
            str(i + 1),
            size=13,
            bold=True,
            color=WHITE,
            align=PP_ALIGN.CENTER,
        )
        textbox(s, left + Inches(0.95), top + Inches(0.4), Inches(2.8), Inches(0.4), title, size=15, bold=True, color=NAVY)
        textbox(s, left + Inches(0.3), top + Inches(1.05), Inches(3.4), Inches(0.9), body, size=13, color=MUTED)


def slide_6(prs):
    """Thank you."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    rect(s, 0, 0, W, H, NAVY)
    rect(s, 0, 0, W, Inches(0.06), BLUE)

    textbox(s, Inches(0.8), Inches(1.8), Inches(11.5), Inches(0.35), "TEAM PANTHER", size=13, color=BLUE, align=PP_ALIGN.CENTER)
    textbox(s, Inches(0.8), Inches(2.4), Inches(11.5), Inches(0.8), "Thank you", size=48, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    textbox(
        s,
        Inches(1.5),
        Inches(3.5),
        Inches(10.3),
        Inches(0.6),
        "Paytm Neighbourhood — street map, rivals, and inventory that pays today’s EDI.",
        size=16,
        color=RGBColor(0xB8, 0xDE, 0xF2),
        align=PP_ALIGN.CENTER,
    )

    round_rect(s, Inches(4.4), Inches(4.6), Inches(4.5), Inches(0.55), BLUE)
    textbox(s, Inches(4.4), Inches(4.7), Inches(4.5), Inches(0.4), "Happy to demo live", size=14, color=WHITE, align=PP_ALIGN.CENTER)

    textbox(
        s,
        Inches(0.8),
        Inches(5.6),
        Inches(11.5),
        Inches(0.35),
        "Demo  ·  Mobile 1122334455  ·  OTP 123456",
        size=13,
        color=RGBColor(0x8A, 0xB8, 0xD4),
        align=PP_ALIGN.CENTER,
    )
    textbox(
        s,
        Inches(0.8),
        Inches(6.5),
        Inches(11.5),
        Inches(0.3),
        "Paytm Merchant Growth AI Hackathon",
        size=11,
        color=RGBColor(0x6A, 0x98, 0xB8),
        align=PP_ALIGN.CENTER,
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
    prs.save(OUT)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
