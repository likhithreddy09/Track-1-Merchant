#!/usr/bin/env python3
"""Paytm Neighbourhood — hackathon pitch deck (Team Panther).

python3 build_deck.py            -> out/Paytm_Neighbourhood_Team_Panther.pptx
python3 build_deck.py --preview  -> also one .pptx per slide in out/preview/
"""

import os
import sys

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

ROOT = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(ROOT, "assets", "screens")
OUT = os.path.join(ROOT, "out", "Paytm_Neighbourhood_Team_Panther.pptx")
PREVIEW_DIR = os.path.join(ROOT, "out", "preview")

# Paytm palette
CYAN = RGBColor(0x00, 0xBA, 0xF2)
NAVY = RGBColor(0x00, 0x29, 0x70)
NAVY_2 = RGBColor(0x0B, 0x3A, 0x8C)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x14, 0x2B, 0x47)
MUTED = RGBColor(0x64, 0x74, 0x8B)
FAINT = RGBColor(0x94, 0xA3, 0xB8)
LINE = RGBColor(0xDB, 0xE5, 0xEE)
PANEL = RGBColor(0xF5, 0xF9, 0xFC)
ICE = RGBColor(0xE6, 0xF7, 0xFD)
RED = RGBColor(0xDC, 0x26, 0x26)
RED_SOFT = RGBColor(0xFE, 0xF2, 0xF2)
GREEN = RGBColor(0x05, 0x96, 0x69)
GREEN_SOFT = RGBColor(0xEC, 0xFD, 0xF5)
AMBER = RGBColor(0xF5, 0x9E, 0x0B)
SKY_TEXT = RGBColor(0xB8, 0xDE, 0xF2)

FONT = "Arial"
FONT_LIGHT = "Arial"
MONO = "Courier New"

# Grid (inches)
SW, SH = 13.333, 7.5
M = 0.6                     # outer margin
CW = SW - 2 * M             # content width
GUT = 0.3                   # gutter
TOP = 1.85                  # content top under header
BOTTOM = 6.9                # content bottom above footer

TOTAL = 7


def I(v):
    return Inches(v)


# ——— Primitives ———


def _alpha(shape, pct):
    """Set fill transparency (pct = opacity 0–100)."""
    sf = shape.fill._xPr.find(qn("a:solidFill"))
    if sf is None or not len(sf):
        return
    clr = sf[0]
    for old in clr.findall(qn("a:alpha")):
        clr.remove(old)
    a = clr.makeelement(qn("a:alpha"), {"val": str(int(pct * 1000))})
    clr.append(a)


def shape(slide, kind, x, y, w, h, fill=None, line=None, line_w=1.0, alpha=None, radius=None, rot=0):
    s = slide.shapes.add_shape(kind, I(x), I(y), I(w), I(h))
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
        if alpha is not None:
            _alpha(s, alpha)
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(line_w)
    if radius is not None:
        try:
            s.adjustments[0] = radius
        except Exception:
            pass
    if rot:
        s.rotation = rot
    s.shadow.inherit = False
    s.text_frame.text = ""
    return s


def rect(slide, x, y, w, h, fill=None, line=None, **kw):
    return shape(slide, MSO_SHAPE.RECTANGLE, x, y, w, h, fill, line, **kw)


def card(slide, x, y, w, h, fill=WHITE, line=LINE, radius=0.06, **kw):
    return shape(slide, MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h, fill, line, radius=radius, **kw)


def oval(slide, x, y, w, h, fill=None, line=None, **kw):
    return shape(slide, MSO_SHAPE.OVAL, x, y, w, h, fill, line, **kw)


def text(
    slide,
    x,
    y,
    w,
    h,
    value,
    size=14,
    color=INK,
    bold=False,
    font=FONT,
    align=PP_ALIGN.LEFT,
    anchor=MSO_ANCHOR.TOP,
    spacing=1.1,
):
    """Text box with zero inner margins so edges align with shapes exactly."""
    box = slide.shapes.add_textbox(I(x), I(y), I(w), I(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    lines = value if isinstance(value, list) else [value]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        runs = line if isinstance(line, list) else [(line, {})]
        for part in runs:
            if isinstance(part, str):
                part = (part, {})
            t, style = part
            r = p.add_run()
            r.text = t
            r.font.size = Pt(style.get("size", size))
            r.font.bold = style.get("bold", bold)
            r.font.color.rgb = style.get("color", color)
            r.font.name = style.get("font", font)
    return box


def poly(slide, points, fill, alpha=None):
    """Closed polygon from (x, y) points in inches."""
    emu = [(int(Inches(px)), int(Inches(py))) for px, py in points]
    fb = slide.shapes.build_freeform(emu[0][0], emu[0][1], scale=1.0)
    fb.add_line_segments(emu[1:], close=True)
    s = fb.convert_to_shape()
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    if alpha is not None:
        _alpha(s, alpha)
    s.line.fill.background()
    s.shadow.inherit = False
    return s


def line_h(slide, x, y, w, color=LINE, weight=1.0):
    c = slide.shapes.add_connector(1, I(x), I(y), I(x + w), I(y))
    c.line.color.rgb = color
    c.line.width = Pt(weight)
    return c


def arrow(slide, x, y, w, h, color=CYAN, alpha=None):
    return shape(slide, MSO_SHAPE.RIGHT_ARROW, x, y, w, h, color, alpha=alpha)


def picture_cover(slide, path, x, y, w, h, anchor="top"):
    """Place an image filling (w,h) without distortion — crop the overflow."""
    if not os.path.exists(path):
        return card(slide, x, y, w, h, PANEL)
    iw, ih = Image.open(path).size
    pic = slide.shapes.add_picture(path, I(x), I(y), I(w), I(h))
    box_ratio = w / h
    img_ratio = iw / ih
    if img_ratio > box_ratio:
        excess = 1 - box_ratio / img_ratio
        pic.crop_left = excess / 2
        pic.crop_right = excess / 2
    elif img_ratio < box_ratio:
        excess = 1 - img_ratio / box_ratio
        if anchor == "top":
            pic.crop_bottom = excess
        else:
            pic.crop_top = excess / 2
            pic.crop_bottom = excess / 2
    pic.line.color.rgb = LINE
    pic.line.width = Pt(0.75)
    return pic


def browser(slide, path, x, y, w, h, url="neighbourhood · KPHB Colony", anchor="top"):
    """Screenshot inside a clean browser-window frame. (x,y,w,h) = outer frame."""
    bar = 0.3
    card(slide, x - 0.02, y - 0.02, w + 0.04, h + 0.04, PANEL, LINE, radius=0.03)
    shape(slide, MSO_SHAPE.ROUND_2_SAME_RECTANGLE, x, y, w, bar, RGBColor(0xEE, 0xF2, 0xF6), radius=0.3)
    for i, c in enumerate([RGBColor(0xF8, 0x71, 0x71), RGBColor(0xFB, 0xBF, 0x24), RGBColor(0x34, 0xD3, 0x99)]):
        oval(slide, x + 0.14 + i * 0.17, y + 0.1, 0.1, 0.1, c)
    pill_w = min(3.2, w - 1.2)
    card(slide, x + (w - pill_w) / 2, y + 0.06, pill_w, 0.18, WHITE, None, radius=0.5)
    text(slide, x + (w - pill_w) / 2, y + 0.06, pill_w, 0.18, url, size=8, color=MUTED,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    return picture_cover(slide, path, x, y + bar, w, h - bar, anchor=anchor)


# ——— Icons (vector, drawn from shapes) ———


def icon_bg(slide, x, y, s, tone=CYAN, alpha=14):
    oval(slide, x, y, s, s, tone, alpha=alpha)


def icon_pin(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    hw = s * 0.36
    cx = x + s / 2
    shape(slide, MSO_SHAPE.ISOSCELES_TRIANGLE, cx - hw * 0.42, y + s * 0.44, hw * 0.84, s * 0.32, color, rot=180)
    oval(slide, cx - hw / 2, y + s * 0.2, hw, hw, color)
    oval(slide, cx - hw * 0.18, y + s * 0.2 + hw * 0.32, hw * 0.36, hw * 0.36, WHITE)


def icon_box(slide, x, y, s, color=CYAN):
    """Carton: body + lid + tape."""
    icon_bg(slide, x, y, s, color)
    bx, bw = x + s * 0.27, s * 0.46
    rect(slide, bx, y + s * 0.4, bw, s * 0.32, color)
    rect(slide, bx - s * 0.03, y + s * 0.3, bw + s * 0.06, s * 0.12, NAVY)
    rect(slide, bx + bw * 0.42, y + s * 0.3, bw * 0.16, s * 0.24, WHITE)


def icon_rupee(slide, x, y, s, color=NAVY):
    icon_bg(slide, x, y, s, color, alpha=12)
    oval(slide, x + s * 0.24, y + s * 0.24, s * 0.52, s * 0.52, color)
    text(slide, x + s * 0.24, y + s * 0.24, s * 0.52, s * 0.52, "₹", size=max(9, int(s * 22)),
         color=WHITE, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def icon_bolt(slide, x, y, s, color=RED):
    icon_bg(slide, x, y, s, color, alpha=12)
    pts = [(0.56, 0.2), (0.32, 0.54), (0.48, 0.54), (0.42, 0.8), (0.68, 0.44), (0.52, 0.44), (0.6, 0.2)]
    poly(slide, [(x + px * s, y + py * s) for px, py in pts], color)


def icon_store(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    bx, bw = x + s * 0.26, s * 0.48
    rect(slide, bx, y + s * 0.42, bw, s * 0.32, color)
    for i in range(4):
        rect(slide, bx + i * bw / 4, y + s * 0.3, bw / 4, s * 0.12, NAVY if i % 2 == 0 else WHITE, NAVY, line_w=0.5)
    rect(slide, bx + bw * 0.38, y + s * 0.54, bw * 0.24, s * 0.2, WHITE)


def icon_chart(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    base = y + s * 0.72
    for i, hh in enumerate([0.18, 0.3, 0.42]):
        rect(slide, x + s * (0.28 + i * 0.16), base - s * hh, s * 0.11, s * hh, color if i == 2 else NAVY)


def icon_people(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    for dx, c in [(-0.11, NAVY), (0.11, color)]:
        cx = x + s * (0.5 + dx)
        oval(slide, cx - s * 0.08, y + s * 0.24, s * 0.16, s * 0.16, c)
        poly(slide, [(cx - s * 0.13, y + s * 0.72), (cx - s * 0.13, y + s * 0.52), (cx - s * 0.08, y + s * 0.44),
                     (cx + s * 0.08, y + s * 0.44), (cx + s * 0.13, y + s * 0.52), (cx + s * 0.13, y + s * 0.72)], c)


def icon_chat(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    shape(slide, MSO_SHAPE.ROUNDED_RECTANGULAR_CALLOUT, x + s * 0.24, y + s * 0.26, s * 0.52, s * 0.38, color)
    for i in range(3):
        oval(slide, x + s * (0.35 + i * 0.11), y + s * 0.41, s * 0.07, s * 0.07, WHITE)


def icon_clock(slide, x, y, s, color=CYAN):
    icon_bg(slide, x, y, s, color)
    oval(slide, x + s * 0.24, y + s * 0.24, s * 0.52, s * 0.52, WHITE, color, line_w=2)
    rect(slide, x + s * 0.485, y + s * 0.33, s * 0.03, s * 0.19, NAVY)
    rect(slide, x + s * 0.5, y + s * 0.485, s * 0.15, s * 0.03, NAVY)


def icon_shield(slide, x, y, s, color=GREEN):
    icon_bg(slide, x, y, s, color, alpha=12)
    shape(slide, MSO_SHAPE.PENTAGON, x + s * 0.3, y + s * 0.26, s * 0.4, s * 0.48, color, rot=90)
    text(slide, x + s * 0.3, y + s * 0.3, s * 0.4, s * 0.4, "✓", size=max(8, int(s * 18)), color=WHITE,
         bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def icon_db(slide, x, y, s, color=NAVY):
    icon_bg(slide, x, y, s, color, alpha=10)
    shape(slide, MSO_SHAPE.CAN, x + s * 0.3, y + s * 0.24, s * 0.4, s * 0.52, color, radius=0.25)


# ——— Chrome ———


def base(prs, n):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    rect(s, 0, 0, SW, SH, WHITE)
    rect(s, 0, 0, SW, 0.06, CYAN)
    line_h(s, M, 7.08, CW, LINE, 0.75)
    text(s, M, 7.16, 8, 0.22, "Team Panther  ·  Paytm Merchant Growth AI", size=9, color=FAINT)
    text(s, SW - M - 1.5, 7.16, 1.5, 0.22, f"{n:02d} / {TOTAL:02d}", size=9, color=FAINT, align=PP_ALIGN.RIGHT)
    return s


def header(s, kicker, title, sub=None):
    rect(s, M, 0.5, 0.28, 0.04, CYAN)
    text(s, M + 0.4, 0.4, 8, 0.25, kicker.upper(), size=10, color=CYAN, bold=True)
    text(s, M, 0.72, CW, 0.55, title, size=28, color=NAVY, font=FONT_LIGHT)
    if sub:
        text(s, M, 1.3, CW, 0.32, sub, size=13, color=MUTED)


def rings(s, cx, cy, radii, color, alpha_start=22, line=None):
    """Concentric catchment rings — the product's visual motif."""
    for i, r in enumerate(radii):
        oval(s, cx - r, cy - r, 2 * r, 2 * r, color, line, line_w=0.75, alpha=max(3, alpha_start - i * 5))


# ——— Slides ———


def slide_title(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    rect(s, 0, 0, SW, SH, WHITE)
    panel_w = 5.6
    rect(s, 0, 0, panel_w, SH, NAVY)
    rings(s, 0.9, 6.7, [0.9, 1.6, 2.3, 3.0], CYAN, alpha_start=16)
    oval(s, 0.82, 6.62, 0.16, 0.16, CYAN)
    rect(s, 0, 0, SW, 0.06, CYAN)

    text(s, M + 0.1, 1.2, 4.5, 0.3, "TEAM PANTHER", size=11, color=CYAN, bold=True)
    text(s, M + 0.1, 1.6, 4.8, 1.5, ["Paytm", "Neighbourhood"], size=40, color=WHITE, bold=True, spacing=0.95)
    text(s, M + 0.1, 3.25, 4.6, 0.8, ["Street map. Nearby rivals.", "Idle stock → today’s EDI."],
         size=18, color=WHITE, font=FONT_LIGHT)
    text(s, M + 0.1, 4.25, 4.4, 0.7,
         "A co-pilot for kirana merchants — see the street, move slow stock, pay the daily cut.",
         size=12, color=SKY_TEXT)

    chips = ["Live map", "Rival intel", "Cover EDI"]
    cx = M + 0.1
    for c in chips:
        w = 0.32 + len(c) * 0.085
        card(s, cx, 5.2, w, 0.34, None, CYAN, radius=0.5)
        text(s, cx, 5.2, w, 0.34, c, size=10, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        cx += w + 0.12

    bx, bw = panel_w + 0.55, SW - panel_w - 0.55 - M
    bh = bw / 1.343 + 0.3
    by = (SH - bh) / 2
    browser(s, os.path.join(SCREENS, "01-landing.png"), bx, by, bw, bh, url="paytm · neighbourhood")
    text(s, bx, by + bh + 0.15, bw, 0.25, "Paytm Merchant Growth AI hackathon  ·  live product",
         size=9, color=FAINT, align=PP_ALIGN.RIGHT)


def slide_problems(prs):
    s = base(prs, 2)
    header(s, "What we solve", "Three linked pains every kirana feels",
           "Not knowing the street leads to wrong stock, wrong stock locks cash, and EDI is still cut every day.")

    cols = [
        (icon_pin, CYAN, "01", "Blind on the street",
         "Who lives nearby? Which rival — or 10-min app — is pulling customers away?",
         "Customers drift silently"),
        (icon_box, CYAN, "02", "Idle stock locks cash",
         "Slow movers and near-expiry SKUs sit for weeks while working capital stays frozen.",
         "Expiry = straight loss"),
        (icon_rupee, NAVY, "03", "EDI still hits daily",
         "Paytm’s daily loan cut falls due at settlement — even when cash is stuck on the shelf.",
         "Cash crunch every morning"),
    ]
    cw = (CW - 2 * GUT) / 3
    ch = 3.55
    for i, (icon, tone, num, title, body, cost) in enumerate(cols):
        x = M + i * (cw + GUT)
        y = TOP
        card(s, x, y, cw, ch)
        rect(s, x + 0.35, y, 0.6, 0.05, tone)
        icon(s, x + 0.35, y + 0.35, 0.75, tone)
        text(s, x + cw - 0.95, y + 0.4, 0.6, 0.4, num, size=22, color=LINE, bold=True, align=PP_ALIGN.RIGHT)
        text(s, x + 0.35, y + 1.3, cw - 0.7, 0.4, title, size=18, color=NAVY, bold=True)
        text(s, x + 0.35, y + 1.78, cw - 0.7, 1.0, body, size=12.5, color=MUTED, spacing=1.2)
        line_h(s, x + 0.35, y + ch - 0.62, cw - 0.7, LINE, 0.75)
        oval(s, x + 0.35, y + ch - 0.4, 0.12, 0.12, RED if i < 2 else AMBER)
        text(s, x + 0.57, y + ch - 0.46, cw - 0.9, 0.25, cost, size=11, color=INK, anchor=MSO_ANCHOR.MIDDLE)

    # loop strip
    y = TOP + ch + 0.35
    h = 0.62
    steps = ["Guess stock", "Wrong SKUs pile up", "Cash locked", "EDI pressure", "Merchant stress"]
    sw = (CW - 0.2 * (len(steps) - 1)) / len(steps)
    for i, st in enumerate(steps):
        x = M + i * (sw + 0.2)
        last = i == len(steps) - 1
        shape(s, MSO_SHAPE.CHEVRON if i else MSO_SHAPE.PENTAGON, x, y, sw + 0.12, h,
              RED_SOFT if last else PANEL, None, radius=0.32)
        text(s, x + 0.3, y, sw - 0.35, h, st, size=11.5, color=RED if last else NAVY,
             bold=last, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, M, y + h + 0.12, CW, 0.25, "The vicious loop we break.", size=10, color=FAINT, align=PP_ALIGN.CENTER)


def slide_streets(prs):
    s = base(prs, 3)
    header(s, "Street intelligence", "Help the merchant know their streets",
           "Live overview + map: people nearby, rivals with pros / cons, and quick-commerce danger zones.")

    fh = 4.5
    fw = (fh - 0.3) * 1.343
    x0 = M + (CW - (2 * fw + GUT)) / 2
    y = TOP - 0.05
    browser(s, os.path.join(SCREENS, "deck-overview.png"), x0, y, fw, fh, url="Overview · KPHB Colony")
    browser(s, os.path.join(SCREENS, "deck-map.png"), x0 + fw + GUT, y, fw, fh, url="Map · rivals + danger zones")

    cap_y = y + fh + 0.2
    caps = [
        [(icon_people, "People & households in 0.5–2 km"), (icon_chart, "Weekly peak day + buyer habits")],
        [(icon_store, "Rival steal-risk, pros & cons"), (icon_bolt, "Zepto / Blinkit dark-store red zones")],
    ]
    for col, items in enumerate(caps):
        x0c = x0 + col * (fw + GUT)
        iw = fw / 2
        for j, (icon, label) in enumerate(items):
            x = x0c + j * iw
            icon(s, x, cap_y, 0.36, RED if icon is icon_bolt else CYAN)
            text(s, x + 0.46, cap_y, iw - 0.5, 0.36, label, size=10.5, color=INK, anchor=MSO_ANCHOR.MIDDLE)


def slide_edi(prs):
    s = base(prs, 4)
    header(s, "Inventory exchange · EDI", "Move stock before it expires — cover today’s EDI",
           "Demand on the street decides who buys. Cash from the deal pays Paytm’s daily cut before settlement.")

    lw = 5.55
    rx = M + lw + GUT + 0.15
    rw = SW - M - rx
    rh = rw / 1.343 + 0.3
    browser(s, os.path.join(SCREENS, "deck-inventory.png"), rx, TOP - 0.05, rw, rh, url="Inventory · Cover EDI")

    steps = [
        (icon_box, "Pick stock", "Ranked by cash unlock · near-expiry first"),
        (icon_pin, "Match a nearby buyer", "Shops / PGs that need the SKU, by demand + distance"),
        (icon_rupee, "Cash covers EDI", "Sale settles before today’s daily cut"),
    ]
    y = TOP
    for i, (icon, title, sub) in enumerate(steps):
        yy = y + i * 0.82
        icon(s, M, yy, 0.56, NAVY if i == 2 else CYAN)
        if i < 2:
            rect(s, M + 0.27, yy + 0.58, 0.02, 0.24, LINE)
        text(s, M + 0.75, yy + 0.02, lw - 0.75, 0.28, title, size=14, color=NAVY, bold=True)
        text(s, M + 0.75, yy + 0.3, lw - 0.75, 0.26, sub, size=11, color=MUTED)

    # EDI maths card — bottom aligned with the screenshot frame
    cy = TOP + 2.55
    ch = (TOP - 0.05 + rh) - cy
    card(s, M, cy, lw, ch, NAVY, None, radius=0.05)
    text(s, M + 0.35, cy + 0.25, 2.5, 0.25, "THE EDI MATHS", size=10, color=CYAN, bold=True)
    text(s, M + lw - 2.85, cy + 0.25, 2.5, 0.25, "demo · Ankit Kirana", size=9, color=SKY_TEXT,
         align=PP_ALIGN.RIGHT)
    text(s, M + 0.35, cy + 0.6, lw - 0.7, 0.7, [
        [("unlock", {"color": CYAN, "font": MONO}), ("   = shelf value × match % × urgency", {"font": MONO})],
        [("edi_days", {"color": CYAN, "font": MONO}), (" = unlock ÷ daily EDI", {"font": MONO})],
    ], size=11.5, color=WHITE, spacing=1.45)
    line_h(s, M + 0.35, cy + 1.32, lw - 0.7, NAVY_2, 1)

    stats = [("₹8,406", "idle on shelf"), ("₹5,632", "can unlock"), ("₹380", "daily EDI"), ("~14 days", "covered")]
    sw = (lw - 0.7) / 4
    for i, (v, l) in enumerate(stats):
        x = M + 0.35 + i * sw
        text(s, x, cy + 1.48, sw, 0.36, v, size=17, color=CYAN if i == 3 else WHITE, bold=True)
        text(s, x, cy + 1.86, sw, 0.22, l, size=9.5, color=SKY_TEXT)


def slide_tech(prs):
    s = base(prs, 5)
    header(s, "Under the hood", "Models, data and stack",
           "Explainable scores — every number on screen comes from a formula we can show.")

    colw = [2.95, 5.75, 2.95]
    gap = (CW - sum(colw)) / 2
    xs = [M, M + colw[0] + gap, M + colw[0] + gap + colw[1] + gap]
    y0 = TOP
    h = 3.85

    titles = ["INPUTS", "ENGINES", "WHAT THE MERCHANT SEES"]
    for x, w, t in zip(xs, colw, titles):
        text(s, x, y0, w, 0.25, t, size=10, color=CYAN, bold=True)

    inputs = [
        (icon_pin, "Browser geolocation", "shop pin"),
        (icon_store, "OpenStreetMap / Places", "rival shops · ★ · reviews"),
        (icon_people, "Census density priors", "people / km² by city"),
        (icon_db, "Paytm settlement + EDI", "production feed"),
        (icon_box, "Merchant stock list", "qty · price · expiry"),
    ]
    rh = (h - 0.35) / len(inputs)
    for i, (icon, a, b) in enumerate(inputs):
        yy = y0 + 0.35 + i * rh
        icon(s, xs[0], yy, 0.48, NAVY if icon is icon_db else CYAN)
        text(s, xs[0] + 0.6, yy + 0.02, colw[0] - 0.6, 0.24, a, size=11, color=INK, bold=True)
        text(s, xs[0] + 0.6, yy + 0.25, colw[0] - 0.6, 0.22, b, size=9.5, color=MUTED)

    engines = [
        ("Gravity catchment", "P = Σ ρ·A·e^(−0.85d)  · 0.5–2 km ±CI"),
        ("Steal-risk", "σ(.42·e^(−1.4d)+.28★+.18vol+.12sent)"),
        ("Review themes", "price·service·wait·stock → 0–5"),
        ("Inventory matcher", "demand + HH + 14·e^(−0.9d) + urgency"),
        ("EDI cover", "days = value×match×urgency ÷ EDI"),
        ("Danger zones", "dark stores ≤ 2 km · 10–15 min reach"),
    ]
    eh = (h - 0.35) / len(engines)
    for i, (name, f) in enumerate(engines):
        yy = y0 + 0.35 + i * eh
        card(s, xs[1], yy, colw[1], eh - 0.08, PANEL, LINE, radius=0.12)
        rect(s, xs[1], yy + 0.1, 0.05, eh - 0.28, RED if name == "Danger zones" else CYAN)
        text(s, xs[1] + 0.2, yy, 1.55, eh - 0.08, name, size=11, color=NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
        text(s, xs[1] + 1.85, yy, colw[1] - 1.95, eh - 0.08, f, size=10, color=INK, font=MONO,
             anchor=MSO_ANCHOR.MIDDLE)

    outputs = [
        (icon_pin, "Street map", "rings · rival pins · red zones"),
        (icon_chart, "Overview", "people · HH · week peak"),
        (icon_store, "Rival card", "steal-risk · pros / cons · move"),
        (icon_rupee, "Cover EDI", "pick → match → cash"),
        (icon_chat, "Ask (Sarvam AI)", "voice + chat · 10 Indian languages"),
    ]
    for i, (icon, a, b) in enumerate(outputs):
        yy = y0 + 0.35 + i * rh
        icon(s, xs[2], yy, 0.48, NAVY if icon is icon_rupee else CYAN)
        text(s, xs[2] + 0.6, yy + 0.02, colw[2] - 0.6, 0.24, a, size=11, color=INK, bold=True)
        text(s, xs[2] + 0.6, yy + 0.25, colw[2] - 0.6, 0.22, b, size=9.5, color=MUTED)

    ay = y0 + 0.35 + (h - 0.35) / 2 - 0.15
    arrow(s, xs[0] + colw[0] + gap / 2 - 0.16, ay, 0.32, 0.3, CYAN, alpha=70)
    arrow(s, xs[1] + colw[1] + gap / 2 - 0.16, ay, 0.32, 0.3, CYAN, alpha=70)

    # stack strip
    sy = y0 + h + 0.3
    text(s, M, sy + 0.04, 1.2, 0.3, "STACK", size=10, color=CYAN, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    stack = ["React 19", "TypeScript", "Vite", "Leaflet + Esri tiles", "OSM Overpass", "Google Places",
             "Sarvam AI", "Vercel edge proxy"]
    x = M + 0.85
    for t in stack:
        w = 0.3 + len(t) * 0.075
        card(s, x, sy, w, 0.38, WHITE, LINE, radius=0.5)
        text(s, x, sy, w, 0.38, t, size=10, color=NAVY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        x += w + 0.1
    text(s, M, sy + 0.55, CW, 0.25,
         "Runs fully in the browser · API keys stay server-side · deterministic seeds keep the demo reproducible.",
         size=9.5, color=FAINT)


def slide_life(prs):
    s = base(prs, 6)
    header(s, "Merchant life", "How this makes their day easier",
           "Same shop, same owner — fewer guesses, less dead stock, calmer settlements.")

    rows = [
        (icon_chart, "Stocking", "Gut feel, last month’s bill book", "Who lives nearby + this week’s peak day"),
        (icon_store, "Rivals", "Find out when regulars stop coming", "Steal-risk, their pros / cons, one move a week"),
        (icon_bolt, "Quick-commerce", "Zepto / Blinkit feel invisible", "Red zones + a fight-back tip per dark store"),
        (icon_box, "Idle stock", "Sits till it expires, then written off", "Sold to a nearby shop before expiry"),
        (icon_rupee, "EDI", "Panic at settlement on slow days", "Cover EDI from stock — days covered shown"),
        (icon_chat, "Help", "Nobody to ask", "Voice / chat answers in their own language"),
    ]
    lw = 2.6
    cw = (CW - lw - GUT) / 2
    xb = M + lw
    xa = xb + cw + GUT
    y = TOP
    hh = 0.4
    text(s, xb + 0.25, y, cw, hh, "BEFORE", size=10, color=RED, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(s, xa + 0.25, y, cw, hh, "WITH NEIGHBOURHOOD", size=10, color=GREEN, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    rh = (BOTTOM - y - hh - 0.05) / len(rows)
    for i, (icon, label, before, after) in enumerate(rows):
        yy = y + hh + 0.05 + i * rh
        icon(s, M, yy + (rh - 0.48) / 2 - 0.04, 0.48, RED if icon is icon_bolt else CYAN)
        text(s, M + 0.62, yy, lw - 0.7, rh - 0.08, label, size=13, color=NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
        card(s, xb, yy, cw, rh - 0.1, RED_SOFT, None, radius=0.15)
        text(s, xb + 0.25, yy, cw - 0.4, rh - 0.1, before, size=11.5, color=RGBColor(0x7F, 0x1D, 0x1D),
             anchor=MSO_ANCHOR.MIDDLE)
        card(s, xa, yy, cw, rh - 0.1, GREEN_SOFT, None, radius=0.15)
        oval(s, xa + 0.22, yy + (rh - 0.1) / 2 - 0.06, 0.12, 0.12, GREEN)
        text(s, xa + 0.45, yy, cw - 0.6, rh - 0.1, after, size=11.5, color=RGBColor(0x06, 0x4E, 0x3B),
             anchor=MSO_ANCHOR.MIDDLE)
        arrow(s, xb + cw + GUT / 2 - 0.1, yy + (rh - 0.1) / 2 - 0.08, 0.2, 0.16, FAINT, alpha=60)


def slide_thanks(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    rect(s, 0, 0, SW, SH, NAVY)
    rings(s, SW / 2, SH / 2 - 0.2, [1.4, 2.2, 3.0, 3.8, 4.6], CYAN, alpha_start=14)
    rect(s, 0, 0, SW, 0.06, CYAN)

    text(s, 0, 1.75, SW, 0.3, "TEAM PANTHER", size=12, color=CYAN, bold=True, align=PP_ALIGN.CENTER)
    text(s, 0, 2.2, SW, 1.0, "Thank you", size=54, color=WHITE, font=FONT_LIGHT, align=PP_ALIGN.CENTER)
    text(s, 2.0, 3.35, SW - 4.0, 0.5,
         "Paytm Neighbourhood — know your street, move idle stock, cover today’s EDI.",
         size=15, color=SKY_TEXT, align=PP_ALIGN.CENTER)

    bw = 4.6
    bx = (SW - bw) / 2
    card(s, bx, 4.3, bw, 0.95, None, CYAN, radius=0.2)
    text(s, bx, 4.4, bw, 0.3, "TRY THE LIVE DEMO", size=10, color=CYAN, bold=True, align=PP_ALIGN.CENTER)
    text(s, bx, 4.72, bw, 0.35, [[("Mobile ", {"color": SKY_TEXT}), ("1122334455", {"bold": True}),
                                    ("     OTP ", {"color": SKY_TEXT}), ("123456", {"bold": True})]],
         size=15, color=WHITE, align=PP_ALIGN.CENTER)

    text(s, 0, 6.75, SW, 0.3, "Paytm Merchant Growth AI hackathon  ·  Questions welcome",
         size=10, color=FAINT, align=PP_ALIGN.CENTER)


SLIDES = [slide_title, slide_problems, slide_streets, slide_edi, slide_tech, slide_life, slide_thanks]


def new_prs():
    prs = Presentation()
    prs.slide_width = I(SW)
    prs.slide_height = I(SH)
    return prs


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    prs = new_prs()
    for fn in SLIDES:
        fn(prs)
    prs.save(OUT)
    print(f"Wrote {OUT}")

    if "--preview" in sys.argv:
        os.makedirs(PREVIEW_DIR, exist_ok=True)
        for i, fn in enumerate(SLIDES, 1):
            p = new_prs()
            fn(p)
            p.save(os.path.join(PREVIEW_DIR, f"slide{i}.pptx"))
        print(f"Wrote per-slide previews to {PREVIEW_DIR}")


if __name__ == "__main__":
    main()
