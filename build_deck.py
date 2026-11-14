#!/usr/bin/env python3
"""Paytm LocalIQ — clean hackathon pitch deck (Team Panther)."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

ASSETS = "/Users/ankitkumar/Desktop/Paytm-Merchant-Growth-AI/assets"
OUT = "/Users/ankitkumar/Desktop/Paytm-Merchant-Growth-AI/out/Paytm_LocalIQ_Team_Panther.pptx"

BLUE = RGBColor(0x00, 0xBA, 0xF2)
BLUE_DK = RGBColor(0x00, 0x99, 0xCC)
NAVY = RGBColor(0x00, 0x29, 0x70)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BG = RGBColor(0xF3, 0xF9, 0xFC)
SOFT = RGBColor(0xE7, 0xF6, 0xFC)
TEXT = RGBColor(0x0F, 0x27, 0x44)
MUTED = RGBColor(0x5B, 0x70, 0x8B)
LINE = RGBColor(0xCD, 0xE3, 0xF0)
ORANGE = RGBColor(0xFF, 0x70, 0x43)

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 8


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
        Inches(7),
        Inches(0.28),
        "Team Panther  |  Paytm Merchant Growth AI",
        size=11,
        color=MUTED,
    )
    textbox(
        slide,
        Inches(11.3),
        Inches(7.18),
        Inches(1.5),
        Inches(0.28),
        f"{n} / {TOTAL}",
        size=11,
        color=MUTED,
        align=PP_ALIGN.RIGHT,
    )


def slide_1(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 1)
    rect(s, 0, Inches(0.08), Inches(5.8), Inches(7.07), BLUE)

    textbox(s, Inches(0.7), Inches(1.15), Inches(4.5), Inches(0.35), "TEAM PANTHER", size=13, bold=True, color=WHITE)
    textbox(s, Inches(0.7), Inches(1.8), Inches(4.7), Inches(1.2), "Paytm\nLocalIQ", size=42, bold=True, color=WHITE)
    textbox(
        s,
        Inches(0.7),
        Inches(3.7),
        Inches(4.5),
        Inches(0.9),
        "Know your neighbourhood.\nMove your stock.",
        size=20,
        bold=True,
        color=WHITE,
    )
    textbox(
        s,
        Inches(0.7),
        Inches(5.0),
        Inches(4.5),
        Inches(1.1),
        "Demand intelligence + merchant inventory\nexchange in one growth platform.",
        size=14,
        color=RGBColor(0xE0, 0xF6, 0xFF),
    )

    img = os.path.join(ASSETS, "hero_localiq.png")
    if os.path.exists(img):
        s.shapes.add_picture(img, Inches(6.5), Inches(1.15), height=Inches(5.1))


def slide_2(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 2)
    textbox(s, Inches(0.65), Inches(0.35), Inches(3), Inches(0.28), "THE PROBLEM", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.65),
        Inches(0.7),
        Inches(12),
        Inches(0.5),
        "Merchants are blind on both sides of the shelf",
        size=26,
        bold=True,
        color=NAVY,
    )

    # Demand card
    round_rect(s, Inches(0.65), Inches(1.5), Inches(5.85), Inches(5.1), WHITE, LINE)
    rect(s, Inches(0.65), Inches(1.5), Inches(5.85), Inches(0.7), BLUE)
    textbox(s, Inches(0.9), Inches(1.65), Inches(5), Inches(0.4), "Demand gap", size=18, bold=True, color=WHITE)
    demand = [
        "They see yesterday’s sales, not neighbourhood potential",
        "No clear view of homes, age mix or local demand",
        "Underserved pockets stay invisible",
        "Buying stays guesswork",
    ]
    for i, t in enumerate(demand):
        y = Inches(2.5 + i * 0.9)
        round_rect(s, Inches(0.95), y, Inches(5.25), Inches(0.75), SOFT, LINE)
        textbox(s, Inches(1.2), y + Inches(0.2), Inches(4.8), Inches(0.4), t, size=14, color=TEXT)

    # Supply card
    round_rect(s, Inches(6.85), Inches(1.5), Inches(5.85), Inches(5.1), WHITE, LINE)
    rect(s, Inches(6.85), Inches(1.5), Inches(5.85), Inches(0.7), ORANGE)
    textbox(s, Inches(7.1), Inches(1.65), Inches(5), Inches(0.4), "Supply gap", size=18, bold=True, color=WHITE)
    supply = [
        "Excess inventory freezes working capital",
        "A nearby shop may need the same SKU today",
        "No trusted local discovery or negotiation",
        "Stockouts and wastage happen side by side",
    ]
    for i, t in enumerate(supply):
        y = Inches(2.5 + i * 0.9)
        round_rect(s, Inches(7.15), y, Inches(5.25), Inches(0.75), RGBColor(0xFF, 0xF1, 0xEC), LINE)
        textbox(s, Inches(7.4), y + Inches(0.2), Inches(4.8), Inches(0.4), t, size=14, color=TEXT)


def slide_3(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 3)
    textbox(s, Inches(0.65), Inches(0.35), Inches(3), Inches(0.28), "THE INSIGHT", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.65),
        Inches(0.7),
        Inches(12),
        Inches(0.55),
        "Two ideas. One product.",
        size=28,
        bold=True,
        color=NAVY,
    )
    textbox(
        s,
        Inches(0.65),
        Inches(1.3),
        Inches(12),
        Inches(0.4),
        "Help merchants understand what the neighbourhood needs — and find what they need from other merchants.",
        size=15,
        color=MUTED,
    )

    img = os.path.join(ASSETS, "compare_pillars.png")
    if os.path.exists(img):
        s.shapes.add_picture(img, Inches(0.7), Inches(1.9), width=Inches(11.9))

    round_rect(s, Inches(0.65), Inches(6.15), Inches(12), Inches(0.75), SOFT, LINE)
    textbox(
        s,
        Inches(0.95),
        Inches(6.32),
        Inches(11.4),
        Inches(0.45),
        "Separately they are tools. Together they are a growth loop: insight → action → local trade → better models.",
        size=14,
        bold=True,
        color=NAVY,
        align=PP_ALIGN.CENTER,
    )


def slide_4(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 4)
    textbox(s, Inches(0.65), Inches(0.35), Inches(3), Inches(0.28), "THE SOLUTION", size=12, bold=True, color=BLUE)
    textbox(s, Inches(0.65), Inches(0.7), Inches(12), Inches(0.5), "Paytm LocalIQ", size=28, bold=True, color=NAVY)
    textbox(
        s,
        Inches(0.65),
        Inches(1.25),
        Inches(12),
        Inches(0.4),
        "One platform with two engines that feed each other.",
        size=15,
        color=MUTED,
    )

    pillars = [
        ("1", "Demand Intelligence", "Map catchment, estimate homes and demand, surface underserved segments, forecast the week ahead."),
        ("2", "Inventory Exchange", "List surplus, search shortages, AI-match by product, distance, price and urgency, negotiate locally."),
        ("3", "AI Growth Loop", "Demand signals decide what to stock. Exchange finds who nearby can fill or take that stock."),
    ]
    for i, (num, title, body) in enumerate(pillars):
        left = Inches(0.65 + i * 4.15)
        round_rect(s, left, Inches(1.95), Inches(3.95), Inches(4.55), WHITE, LINE)
        rect(s, left, Inches(1.95), Inches(3.95), Inches(1.15), BLUE)
        textbox(s, left + Inches(0.3), Inches(2.2), Inches(1), Inches(0.55), num, size=30, bold=True, color=WHITE)
        textbox(s, left + Inches(0.3), Inches(3.4), Inches(3.35), Inches(0.8), title, size=18, bold=True, color=NAVY)
        textbox(s, left + Inches(0.3), Inches(4.35), Inches(3.35), Inches(1.8), body, size=14, color=MUTED)


def slide_5(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 5)
    textbox(s, Inches(0.55), Inches(0.3), Inches(4), Inches(0.28), "PRODUCT", size=12, bold=True, color=BLUE)
    textbox(s, Inches(0.55), Inches(0.58), Inches(10), Inches(0.4), "What the merchant sees", size=24, bold=True, color=NAVY)

    img = os.path.join(ASSETS, "dashboard_localiq.png")
    if os.path.exists(img):
        s.shapes.add_picture(img, Inches(0.45), Inches(1.1), width=Inches(8.5))

    round_rect(s, Inches(9.2), Inches(1.1), Inches(3.6), Inches(5.5), SOFT, LINE)
    textbox(s, Inches(9.45), Inches(1.35), Inches(3.1), Inches(0.35), "Clear labels", size=15, bold=True, color=NAVY)
    items = [
        ("Estimate", "Homes & market size"),
        ("Forecast", "Tomorrow & week ahead"),
        ("Exchange", "Nearby surplus / need"),
        ("Action", "AI next step"),
    ]
    for i, (t, b) in enumerate(items):
        y = Inches(1.9 + i * 1.05)
        round_rect(s, Inches(9.45), y, Inches(3.1), Inches(0.85), WHITE, LINE)
        textbox(s, Inches(9.65), y + Inches(0.12), Inches(2.7), Inches(0.3), t, size=14, bold=True, color=BLUE)
        textbox(s, Inches(9.65), y + Inches(0.42), Inches(2.7), Inches(0.3), b, size=12, color=MUTED)


def slide_6(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 6)
    textbox(s, Inches(0.65), Inches(0.3), Inches(4), Inches(0.28), "HOW IT WORKS", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.65),
        Inches(0.6),
        Inches(12),
        Inches(0.45),
        "From market signal to local trade",
        size=24,
        bold=True,
        color=NAVY,
    )

    img = os.path.join(ASSETS, "growth_loop.png")
    if os.path.exists(img):
        s.shapes.add_picture(img, Inches(0.5), Inches(1.25), width=Inches(12.3))

    ex = os.path.join(ASSETS, "exchange_panel.png")
    if os.path.exists(ex):
        s.shapes.add_picture(ex, Inches(1.6), Inches(3.2), width=Inches(10.1))


def slide_7(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 7)
    textbox(s, Inches(0.65), Inches(0.35), Inches(3), Inches(0.28), "IMPACT", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.65),
        Inches(0.7),
        Inches(12),
        Inches(0.5),
        "Better decisions for merchants. More value for Paytm.",
        size=24,
        bold=True,
        color=NAVY,
    )

    cols = [
        (
            "Merchants",
            [
                "Recover capital from dead stock",
                "Prevent stockouts with local refill",
                "Buy for the real neighbourhood",
                "Less guesswork, clearer planning",
            ],
        ),
        (
            "Paytm",
            [
                "Daily reasons to open the app",
                "More settlement on Paytm rails",
                "Stronger merchant stickiness",
                "Growth layer beyond payments",
            ],
        ),
        (
            "Network effect",
            [
                "Every listing improves matching",
                "Every trade improves demand models",
                "Neighbourhood IQ compounds",
                "One flywheel, not two silos",
            ],
        ),
    ]
    for i, (title, bullets) in enumerate(cols):
        left = Inches(0.65 + i * 4.15)
        round_rect(s, left, Inches(1.5), Inches(3.95), Inches(5.1), WHITE, LINE)
        rect(s, left, Inches(1.5), Inches(3.95), Inches(0.75), BLUE)
        textbox(s, left + Inches(0.25), Inches(1.65), Inches(3.4), Inches(0.45), title, size=18, bold=True, color=WHITE)
        for j, b in enumerate(bullets):
            y = Inches(2.55 + j * 0.85)
            circ = s.shapes.add_shape(
                MSO_SHAPE.OVAL, left + Inches(0.3), y + Inches(0.08), Inches(0.18), Inches(0.18)
            )
            circ.fill.solid()
            circ.fill.fore_color.rgb = BLUE
            circ.line.fill.background()
            textbox(s, left + Inches(0.65), y, Inches(3.0), Inches(0.55), b, size=13, color=TEXT)


def slide_8(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    footer(s, 8)
    textbox(s, Inches(0.65), Inches(0.35), Inches(3), Inches(0.28), "WHY PAYTM + VISION", size=12, bold=True, color=BLUE)
    textbox(
        s,
        Inches(0.65),
        Inches(0.7),
        Inches(12),
        Inches(0.5),
        "Only Paytm can close this loop at scale",
        size=24,
        bold=True,
        color=NAVY,
    )

    reasons = [
        ("Merchant graph", "Millions of merchants already on Paytm"),
        ("Trusted settlement", "Exchange deals clear on existing rails"),
        ("Location + payments", "Strong base to estimate local activity"),
        ("App habit", "Insights live where merchants already work"),
    ]
    for i, (t, b) in enumerate(reasons):
        left = Inches(0.65 + (i % 4) * 3.1)
        round_rect(s, left, Inches(1.45), Inches(2.95), Inches(1.7), SOFT, LINE)
        textbox(s, left + Inches(0.2), Inches(1.65), Inches(2.55), Inches(0.4), t, size=14, bold=True, color=NAVY)
        textbox(s, left + Inches(0.2), Inches(2.15), Inches(2.55), Inches(0.7), b, size=12, color=MUTED)

    round_rect(s, Inches(0.65), Inches(3.5), Inches(12), Inches(3.1), BLUE)
    textbox(
        s,
        Inches(1.0),
        Inches(3.9),
        Inches(11.3),
        Inches(0.35),
        "VISION",
        size=13,
        bold=True,
        color=WHITE,
        align=PP_ALIGN.CENTER,
    )
    textbox(
        s,
        Inches(1.0),
        Inches(4.4),
        Inches(11.3),
        Inches(1.2),
        "Give every small merchant the market intelligence of a retail chain —\nand a neighbourhood network to act on it.",
        size=22,
        bold=True,
        color=WHITE,
        align=PP_ALIGN.CENTER,
    )
    textbox(
        s,
        Inches(1.0),
        Inches(5.8),
        Inches(11.3),
        Inches(0.45),
        "Paytm LocalIQ  ·  Know your neighbourhood. Move your stock.",
        size=14,
        color=RGBColor(0xE0, 0xF6, 0xFF),
        align=PP_ALIGN.CENTER,
    )


def main():
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
    slide_8(prs)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs.save(OUT)
    print("Saved:", OUT)


if __name__ == "__main__":
    main()
