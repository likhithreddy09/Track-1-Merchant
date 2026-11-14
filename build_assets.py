#!/usr/bin/env python3
"""Paytm LocalIQ visual assets — brand blues, clean flat illustrations."""

import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch
import numpy as np

OUT = "/Users/ankitkumar/Desktop/Paytm-Merchant-Growth-AI/assets"
os.makedirs(OUT, exist_ok=True)

BLUE = "#00BAF2"
BLUE_DK = "#0099CC"
NAVY = "#002970"
WHITE = "#FFFFFF"
BG = "#F3F9FC"
SOFT = "#E7F6FC"
TEXT = "#0F2744"
MUTED = "#5B708B"
LINE = "#CDE3F0"
ORANGE = "#FF7043"


def font(size, bold=False):
    path = (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        if bold
        else "/System/Library/Fonts/Supplemental/Arial.ttf"
    )
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def save_fig(fig, name, dpi=220):
    path = os.path.join(OUT, name)
    fig.savefig(
        path,
        dpi=dpi,
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
        edgecolor="none",
        pad_inches=0.05,
    )
    plt.close(fig)
    print("wrote", path)


def asset_hero():
    fig, ax = plt.subplots(figsize=(7.4, 5.8), facecolor=WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")

    ax.add_patch(
        FancyBboxPatch(
            (0.25, 0.25),
            9.5,
            7.5,
            boxstyle="round,pad=0.02,rounding_size=0.28",
            facecolor=SOFT,
            edgecolor=LINE,
            lw=1.5,
        )
    )

    cx, cy = 4.4, 4.1
    for r, a in [(3.1, 0.10), (2.2, 0.16), (1.35, 0.26)]:
        ax.add_patch(Circle((cx, cy), r, color=BLUE, alpha=a, zorder=1))
        ax.add_patch(
            Circle((cx, cy), r, fill=False, edgecolor=BLUE, lw=1.5, alpha=0.55, zorder=2)
        )

    # opportunity pocket
    ax.add_patch(Circle((7.7, 2.5), 1.05, color=ORANGE, alpha=0.14, zorder=1))
    ax.add_patch(
        Circle(
            (7.7, 2.5),
            1.05,
            fill=False,
            edgecolor=ORANGE,
            lw=1.8,
            linestyle="--",
            zorder=2,
        )
    )

    nodes = [(2.0, 6.2, "Homes"), (7.2, 6.3, "Offices"), (2.1, 1.9, "Society")]
    for x, y, label in nodes:
        ax.plot([cx, x], [cy, y], color=BLUE, alpha=0.3, lw=1.4, zorder=2)
        ax.add_patch(Circle((x, y), 0.3, color=WHITE, ec=BLUE, lw=2, zorder=3))
        ax.add_patch(Circle((x, y), 0.11, color=BLUE, zorder=4))
        ax.text(x, y - 0.52, label, ha="center", color=NAVY, fontsize=9, fontweight="bold")

    ax.add_patch(Circle((cx, cy), 0.46, color=BLUE, zorder=5))
    ax.add_patch(Circle((cx, cy), 0.25, color=WHITE, zorder=6))
    ax.text(cx, cy - 0.82, "Your shop", ha="center", color=NAVY, fontsize=11, fontweight="bold")
    ax.text(7.7, 1.15, "Opportunity", ha="center", color=ORANGE, fontsize=9, fontweight="bold")

    # exchange hint
    ax.add_patch(
        FancyBboxPatch(
            (6.3, 5.55),
            3.2,
            1.55,
            boxstyle="round,pad=0.02,rounding_size=0.15",
            facecolor=WHITE,
            edgecolor=LINE,
            lw=1.3,
            zorder=7,
        )
    )
    ax.text(7.9, 6.7, "AI Match", ha="center", color=BLUE_DK, fontsize=9, fontweight="bold", zorder=8)
    ax.text(7.9, 6.15, "Shop B · 1.8 km", ha="center", color=NAVY, fontsize=10, fontweight="bold", zorder=8)
    ax.text(7.9, 5.8, "40 units surplus", ha="center", color=MUTED, fontsize=8, zorder=8)

    save_fig(fig, "hero_localiq.png")


def asset_loop():
    fig, ax = plt.subplots(figsize=(12.4, 2.2), facecolor=WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 12.4)
    ax.set_ylim(0, 2.2)
    ax.axis("off")

    steps = [
        (0.2, "Read\nneighbourhood", False),
        (2.6, "Decide stock\n& promos", False),
        (5.0, "Detect surplus\n/ shortage", False),
        (7.4, "Rank local\nmatches", False),
        (9.8, "Settle on\nPaytm", True),
    ]
    for i, (x, label, final) in enumerate(steps):
        ax.add_patch(
            FancyBboxPatch(
                (x, 0.35),
                2.15,
                1.5,
                boxstyle="round,pad=0.02,rounding_size=0.16",
                facecolor=BLUE if final else SOFT,
                edgecolor=BLUE,
                lw=1.5,
            )
        )
        ax.text(
            x + 1.075,
            1.1,
            label,
            ha="center",
            va="center",
            color=WHITE if final else NAVY,
            fontsize=11,
            fontweight="bold",
            linespacing=1.25,
        )
        if i < 4:
            ax.annotate(
                "",
                xy=(x + 2.5, 1.1),
                xytext=(x + 2.2, 1.1),
                arrowprops=dict(arrowstyle="->", color=BLUE, lw=2),
            )
    save_fig(fig, "growth_loop.png")


def asset_dashboard():
    W, H = 1480, 920
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title = font(26, True)
    f_h = font(18, True)
    f_n = font(30, True)
    f_s = font(14)
    f_xs = font(12)
    f_b = font(15, True)

    d.rounded_rectangle([36, 28, W - 36, H - 28], radius=28, fill=WHITE, outline=LINE, width=2)
    d.rounded_rectangle([36, 28, W - 36, 108], radius=28, fill=BLUE)
    d.rectangle([36, 78, W - 36, 108], fill=BLUE)
    d.text((70, 52), "Paytm LocalIQ", fill=WHITE, font=f_title)
    d.text((W - 320, 58), "Kirana  ·  Kukatpally", fill=WHITE, font=f_s)

    kpis = [
        ("2,400", "Homes nearby", "ESTIMATE"),
        ("Rs 6,800", "Tomorrow", "FORECAST"),
        ("3 matches", "Stock nearby", "EXCHANGE"),
        ("38%", "Still untapped", "OPPORTUNITY"),
    ]
    for i, (val, label, tag) in enumerate(kpis):
        x0 = 70 + i * 345
        y0 = 135
        d.rounded_rectangle([x0, y0, x0 + 320, y0 + 120], radius=16, fill=SOFT, outline=LINE, width=1)
        d.text((x0 + 18, y0 + 14), tag, fill=BLUE_DK, font=f_xs)
        d.text((x0 + 18, y0 + 40), val, fill=NAVY, font=f_n)
        d.text((x0 + 18, y0 + 84), label, fill=MUTED, font=f_s)

    # map
    d.rounded_rectangle([70, 280, 860, 880], radius=18, fill=BG, outline=LINE, width=1)
    d.text((90, 298), "Neighbourhood + local stock", fill=NAVY, font=f_h)

    heat = Image.new("RGBA", (760, 520), (243, 249, 252, 255))
    hd = ImageDraw.Draw(heat)
    for x in range(20, 740, 50):
        hd.line([(x, 10), (x, 510)], fill=(205, 227, 240, 255), width=2)
    for y in range(20, 500, 45):
        hd.line([(10, y), (750, y)], fill=(205, 227, 240, 255), width=2)

    for x, y, r, col in [
        (280, 230, 110, (0, 186, 242, 70)),
        (470, 170, 80, (0, 186, 242, 45)),
        (580, 310, 105, (255, 112, 67, 70)),
        (190, 360, 70, (0, 186, 242, 40)),
    ]:
        ov = Image.new("RGBA", heat.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.ellipse([x - r, y - r, x + r, y + r], fill=col)
        ov = ov.filter(ImageFilter.GaussianBlur(22))
        heat = Image.alpha_composite(heat, ov)

    hd = ImageDraw.Draw(heat)
    hd.ellipse([240, 150, 460, 370], outline=(0, 186, 242, 220), width=3)
    hd.ellipse([330, 240, 370, 280], fill=(0, 186, 242, 255))
    hd.ellipse([342, 252, 358, 268], fill=(255, 255, 255, 255))
    # exchange pins
    for x, y in [(520, 250), (610, 360), (430, 390)]:
        hd.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 112, 67, 255))
        hd.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 255, 255, 255))

    img.paste(heat, (90, 340), heat)
    d.text((90, 845), "Blue = catchment   ·   Orange = demand pocket / stock match", fill=MUTED, font=f_xs)

    # side actions
    d.rounded_rectangle([890, 280, W - 70, 560], radius=18, fill=SOFT, outline=LINE, width=1)
    d.text((915, 300), "AI recommendation", fill=NAVY, font=f_h)
    d.text((915, 345), "Restock beverages before Saturday.", fill=TEXT, font=f_b)
    d.text((915, 375), "Shop A is 1.8 km away with 40 surplus", fill=MUTED, font=f_s)
    d.text((915, 400), "units of Thums Up 750ml.", fill=MUTED, font=f_s)
    d.rounded_rectangle([915, 450, W - 100, 510], radius=12, fill=BLUE)
    d.text((945, 468), "Negotiate with Shop A", fill=WHITE, font=f_b)

    d.rounded_rectangle([890, 585, W - 70, 880], radius=18, fill=WHITE, outline=LINE, width=1)
    d.text((915, 605), "Why this match", fill=NAVY, font=f_h)
    reasons = [
        "Weekend demand lift in catchment",
        "Your shelf is already low",
        "Price 8% below distributor",
        "Distance under 2 km",
    ]
    for i, r in enumerate(reasons):
        y = 655 + i * 48
        d.ellipse([915, y + 4, 933, y + 22], fill=BLUE)
        d.text((948, y + 2), r, fill=TEXT, font=f_s)

    path = os.path.join(OUT, "dashboard_localiq.png")
    img.save(path, quality=95)
    print("wrote", path)


def asset_exchange():
    W, H = 1280, 720
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    f_h = font(22, True)
    f_b = font(16, True)
    f_s = font(14)
    f_xs = font(12)

    d.rounded_rectangle([30, 30, W - 30, H - 30], radius=24, fill=BG, outline=LINE, width=2)
    d.text((60, 55), "Inventory Exchange", fill=NAVY, font=f_h)
    d.text((60, 90), "AI ranked by product · distance · urgency · price", fill=MUTED, font=f_s)

    rows = [
        ("Thums Up 750ml · 40 units", "Shop A · 1.8 km · Rs 28/unit", "High urgency", True),
        ("Maggi Family Pack · 24 units", "Shop C · 2.4 km · Rs 11/unit", "Demand rising", False),
        ("Your excess: Detergent 1kg", "3 nearby shops may need refill", "Recover capital", False),
    ]
    for i, (title, sub, badge, hot) in enumerate(rows):
        y = 140 + i * 160
        d.rounded_rectangle([60, y, W - 60, y + 130], radius=18, fill=WHITE, outline=LINE, width=1)
        d.text((90, y + 28), title, fill=NAVY, font=f_b)
        d.text((90, y + 62), sub, fill=MUTED, font=f_s)
        bx1, bx2 = W - 320, W - 180
        fill = "#FFE8E0" if hot else SOFT
        color = "#D84315" if hot else BLUE_DK
        d.rounded_rectangle([bx1, y + 30, bx2, y + 62], radius=999, fill=fill)
        d.text((bx1 + 18, y + 36), badge, fill=color, font=f_xs)
        d.rounded_rectangle([W - 160, y + 70, W - 90, y + 108], radius=999, fill=BLUE)
        d.text((W - 148, y + 80), "Match", fill=WHITE, font=f_xs)

    path = os.path.join(OUT, "exchange_panel.png")
    img.save(path, quality=95)
    print("wrote", path)


def asset_compare():
    fig, ax = plt.subplots(figsize=(11.5, 4.2), facecolor=WHITE)
    ax.set_facecolor(WHITE)
    ax.set_xlim(0, 11.5)
    ax.set_ylim(0, 4.2)
    ax.axis("off")

    cards = [
        (0.3, "Inventory Exchange", "Supply", "Find stock", "Recover capital", "Connects merchants", BLUE),
        (4.05, "Demand Intelligence", "Demand", "Understand market", "Smarter decisions", "Neighbourhood IQ", BLUE_DK),
        (7.8, "Paytm LocalIQ", "Both together", "Act on insight", "Closed growth loop", "One flywheel", NAVY),
    ]
    for x, title, focus, helps, benefit, network, color in cards:
        ax.add_patch(
            FancyBboxPatch(
                (x, 0.35),
                3.4,
                3.5,
                boxstyle="round,pad=0.02,rounding_size=0.18",
                facecolor=WHITE,
                edgecolor=LINE,
                lw=1.5,
            )
        )
        ax.add_patch(FancyBboxPatch((x, 3.15), 3.4, 0.7, boxstyle="square,pad=0", facecolor=color, edgecolor=color))
        ax.text(x + 1.7, 3.5, title, ha="center", va="center", color=WHITE, fontsize=12, fontweight="bold")
        rows = [("Focus", focus), ("Helps with", helps), ("Benefit", benefit), ("Network", network)]
        for i, (k, v) in enumerate(rows):
            yy = 2.6 - i * 0.55
            ax.text(x + 0.25, yy, k, color=MUTED, fontsize=9)
            ax.text(x + 0.25, yy - 0.22, v, color=NAVY, fontsize=11, fontweight="bold")
    save_fig(fig, "compare_pillars.png")


if __name__ == "__main__":
    asset_hero()
    asset_loop()
    asset_dashboard()
    asset_exchange()
    asset_compare()
    print("done")
