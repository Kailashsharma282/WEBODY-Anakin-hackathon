import os
import subprocess
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

def create_polished_slide(
    bg_img_path: str,
    output_path: str,
    phase_badge: str,
    title: str,
    subtitle: str,
    slide_index: int,
    total_slides: int = 8
):
    canvas_w, canvas_h = 1920, 1080
    canvas = Image.new("RGB", (canvas_w, canvas_h), (11, 15, 25)) # Obsidian slate #0B0F19
    draw = ImageDraw.Draw(canvas)
    
    # Top bar
    draw.rectangle([(0, 0), (canvas_w, 55)], fill=(15, 23, 42)) # #0F172A
    draw.line([(0, 55), (canvas_w, 55)], fill=(30, 41, 59), width=2)
    
    # Bottom HUD panel
    hud_y = canvas_h - 110
    draw.rectangle([(0, hud_y), (canvas_w, canvas_h)], fill=(15, 23, 42))
    draw.line([(0, hud_y), (canvas_w, hud_y)], fill=(30, 41, 59), width=2)
    
    # Scale and center screenshot
    try:
        raw_img = Image.open(bg_img_path).convert("RGB")
        target_w = 1880
        target_h = hud_y - 70
        
        raw_ratio = raw_img.width / raw_img.height
        box_ratio = target_w / target_h
        if raw_ratio > box_ratio:
            new_w = target_w
            new_h = int(target_w / raw_ratio)
        else:
            new_h = target_h
            new_w = int(target_h * raw_ratio)
            
        scaled_img = raw_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        img_x = (canvas_w - new_w) // 2
        img_y = 65 + (target_h - new_h) // 2
        
        draw.rectangle(
            [(img_x - 3, img_y - 3), (img_x + new_w + 2, img_y + new_h + 2)],
            outline=(59, 130, 246),
            width=2
        )
        canvas.paste(scaled_img, (img_x, img_y))
    except Exception as e:
        print(f"Error loading image {bg_img_path}: {e}")

    try:
        font_header = ImageFont.truetype("arial.ttf", 20)
        font_badge = ImageFont.truetype("arialbd.ttf", 16)
        font_title = ImageFont.truetype("arialbd.ttf", 25)
        font_sub = ImageFont.truetype("arial.ttf", 18)
        font_presenter = ImageFont.truetype("arialbd.ttf", 17)
    except:
        font_header = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_presenter = ImageFont.load_default()

    # Top Header Text
    draw.text((25, 17), "WEBODY 2.0: The Living Operating System for the Internet", fill=(6, 182, 212), font=font_header)
    draw.text((1060, 17), "ANAKIN FORGE HACKATHON | Pochiraju Kailash Ram Markandeya Sharma (kailashsharma)", fill=(203, 213, 225), font=font_presenter)

    # Bottom HUD Elements
    badge_x, badge_y = 30, hud_y + 16
    draw.rectangle([(badge_x, badge_y), (badge_x + 230, badge_y + 30)], fill=(6, 182, 212, 40), outline=(6, 182, 212), width=1)
    draw.text((badge_x + 10, badge_y + 5), phase_badge, fill=(255, 255, 255), font=font_badge)

    draw.text((badge_x + 250, hud_y + 14), title, fill=(248, 250, 252), font=font_title)
    draw.text((badge_x + 250, hud_y + 52), subtitle, fill=(148, 163, 184), font=font_sub)

    # Animated progress bar
    prog_pct = slide_index / total_slides
    draw.rectangle([(0, canvas_h - 6), (int(canvas_w * prog_pct), canvas_h)], fill=(6, 182, 212))

    canvas.save(output_path, quality=95)
    print(f"Generated slide: {output_path}")


def main():
    base_dir = Path(r"C:\Users\kaila\.gemini\antigravity-ide\brain\4484b298-f0af-4b45-9b31-f802d3ae6a4f")
    scratch_dir = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\scratch")
    slides_dir = scratch_dir / "v2_slides"
    slides_dir.mkdir(parents=True, exist_ok=True)

    slides_info = [
        {
            "img": base_dir / "v2_01_dashboard_rivalries_1789225717873.png",
            "badge": "COMMAND DECK & RIVALRIES",
            "title": "WEBODY 2.0: Multi-Rivalry Dynamic Benchmark Engine",
            "subtitle": "Pochiraju Kailash Ram Markandeya Sharma | Team kailashsharma | Select and simulate any market rivalry on demand",
            "duration": 38.0
        },
        {
            "img": base_dir / "v2_02_world_graph_1789225724434.png",
            "badge": "LIVING WORLD MODEL",
            "title": "Continuous 2.5D Spatial Entity Graph & WebSocket Telemetry",
            "subtitle": "Persistent temporal knowledge base tracking competitive signals, market dependencies, and real-time shifts",
            "duration": 22.0
        },
        {
            "img": base_dir / "v2_04_run_the_future_trail_1789225922239.png",
            "badge": "PHASE 1 & 2: OBSERVE & UNDERSTAND",
            "title": "Sentinel Surveillance & Cortex Multi-Citation Investigation",
            "subtitle": "-22% pricing slash captured with SHA-256 fingerprint; 3 verified citations extracted via Anakin Agentic Search",
            "duration": 34.0
        },
        {
            "img": base_dir / "04_rlhf_simulations_1789224134451.png",
            "badge": "PHASE 3 & 4: PREDICT & SIMULATE",
            "title": "Oracle Bayesian Forecasting & Monte Carlo RLHF Strategy Sliders",
            "subtitle": "84% platform launch probability; executive RLHF sliders re-rank counter-pathways in real-time",
            "duration": 35.0
        },
        {
            "img": base_dir / "v2_05_war_room_simulator_1789226074863.png",
            "badge": "WAR ROOM SIMULATOR",
            "title": "Multi-Turn Adversarial War Room (90-Day Game-Theoretic Equilibrium)",
            "subtitle": "Turn 1 Blue Move -> Turn 2 Red Retaliation -> Turn 3 Blue Equilibrium | 92/100 Market Defensibility Score",
            "duration": 42.0
        },
        {
            "img": base_dir / "v2_06_actions_wire_1789226154797.png",
            "badge": "PHASE 5: ACT (ANAKIN WIRE)",
            "title": "Hands Action Studio: Multi-Platform Execution & Canary Safety",
            "subtitle": "Active tool dispatcher across GitHub, Slack, HubSpot CRM, Linear, and Webhooks with schema verification",
            "duration": 36.0
        },
        {
            "img": base_dir / "v2_10_audit_proof_1789227592166.png",
            "badge": "FORENSIC AUDIT CHAIN",
            "title": "Cryptographic SHA-256 Provenance (Zero AI Hallucination)",
            "subtitle": "Verifiable Merkle chain linking DOM diffs, agentic search citations, forecasts, and Wire action tokens",
            "duration": 28.0
        },
        {
            "img": base_dir / "v2_12_anakin_inspector_1789227709951.png",
            "badge": "ANAKIN FORGE SUITE",
            "title": "8 Native Anakin Capabilities, SSRF Guard & 100% Test Pass Rate",
            "subtitle": "Map, Crawl, Scrape, Search API, Agentic Search, Website Monitoring, AI Visibility, Wire | 31/31 Tests Passed",
            "duration": 24.57
        }
    ]

    concat_file = scratch_dir / "concat_v2.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        f.write("ffconcat version 1.0\n")
        for i, s in enumerate(slides_info, 1):
            slide_png = slides_dir / f"slide_v2_{i:02d}.png"
            create_polished_slide(
                str(s["img"]),
                str(slide_png),
                s["badge"],
                s["title"],
                s["subtitle"],
                i,
                len(slides_info)
            )
            clean_path = str(slide_png).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
            f.write(f"duration {s['duration']}\n")
        last_clean = str(slides_dir / f"slide_v2_{len(slides_info):02d}.png").replace("\\", "/")
        f.write(f"file '{last_clean}'\n")

    print(f"Generated concat file at: {concat_file}")

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    audio_wav = scratch_dir / "webody_updated_narration.wav"
    out_mp4 = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\artifacts\webody_live_demo_with_audio.mp4")
    brain_mp4 = base_dir / "webody_live_demo_with_audio.mp4"

    cmd = [
        ffmpeg,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-i", str(audio_wav),
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(out_mp4)
    ]

    print("Encoding updated master presentation video...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg Error:", res.stderr)
        raise RuntimeError("Failed to encode video")

    print(f"Updated master video created: {out_mp4} ({out_mp4.stat().st_size} bytes)")
    shutil.copy2(str(out_mp4), str(brain_mp4))
    print(f"Updated master video copied to brain: {brain_mp4}")

    # Also copy slides to brain directory for carousel preview
    brain_slides = base_dir / "scratch" / "v2_slides"
    brain_slides.mkdir(parents=True, exist_ok=True)
    for f in os.listdir(slides_dir):
        shutil.copy2(str(slides_dir / f), str(brain_slides / f))
    print(f"Copied slides to brain: {brain_slides}")

if __name__ == "__main__":
    main()
