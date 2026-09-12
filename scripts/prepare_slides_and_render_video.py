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
    
    # 1. Base canvas with sleek dark gradient
    canvas = Image.new("RGB", (canvas_w, canvas_h), (11, 15, 25)) # #0B0F19
    draw = ImageDraw.Draw(canvas)
    
    # Draw subtle background grid or top/bottom header bars
    # Top bar
    draw.rectangle([(0, 0), (canvas_w, 55)], fill=(15, 23, 42)) # #0F172A
    draw.line([(0, 55), (canvas_w, 55)], fill=(30, 41, 59), width=2)
    
    # Bottom HUD panel
    hud_y = canvas_h - 110
    draw.rectangle([(0, hud_y), (canvas_w, canvas_h)], fill=(15, 23, 42))
    draw.line([(0, hud_y), (canvas_w, hud_y)], fill=(30, 41, 59), width=2)
    
    # 2. Place screenshot inside viewport
    # Available area: Y from 60 to hud_y - 10 (height = 910)
    # Available width: canvas_w - 40 = 1880
    try:
        raw_img = Image.open(bg_img_path).convert("RGB")
        target_w = 1880
        target_h = hud_y - 70 # ~900px
        
        # Scale to fit
        raw_ratio = raw_img.width / raw_img.height
        box_ratio = target_w / target_h
        if raw_ratio > box_ratio:
            new_w = target_w
            new_h = int(target_w / raw_ratio)
        else:
            new_h = target_h
            new_w = int(target_h * raw_ratio)
            
        scaled_img = raw_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center the image
        img_x = (canvas_w - new_w) // 2
        img_y = 65 + (target_h - new_h) // 2
        
        # Border around image
        draw.rectangle(
            [(img_x - 3, img_y - 3), (img_x + new_w + 2, img_y + new_h + 2)],
            outline=(59, 130, 246), # Cyan/blue glow
            width=2
        )
        canvas.paste(scaled_img, (img_x, img_y))
    except Exception as e:
        print(f"Error loading image {bg_img_path}: {e}")

    # 3. Add text annotations
    # Use default font or load TTF if available
    try:
        font_header = ImageFont.truetype("arial.ttf", 20)
        font_badge = ImageFont.truetype("arialbd.ttf", 16)
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_sub = ImageFont.truetype("arial.ttf", 19)
        font_presenter = ImageFont.truetype("arialbd.ttf", 18)
    except:
        font_header = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_presenter = ImageFont.load_default()

    # Top Header Text
    draw.text((25, 17), "WEBODY: The Living Operating System for the Internet", fill=(6, 182, 212), font=font_header)
    draw.text((1060, 17), "ANAKIN FORGE HACKATHON | Pochiraju Kailash Ram Markandeya Sharma (kailashsharma)", fill=(203, 213, 225), font=font_presenter)

    # Bottom HUD Elements
    # Badge
    badge_x, badge_y = 30, hud_y + 16
    draw.rectangle([(badge_x, badge_y), (badge_x + 220, badge_y + 30)], fill=(6, 182, 212, 40), outline=(6, 182, 212), width=1)
    draw.text((badge_x + 12, badge_y + 5), phase_badge, fill=(255, 255, 255), font=font_badge)

    # Title & Subtitle
    draw.text((badge_x + 240, hud_y + 14), title, fill=(248, 250, 252), font=font_title)
    draw.text((badge_x + 240, hud_y + 52), subtitle, fill=(148, 163, 184), font=font_sub)

    # Progress bar at very bottom
    prog_pct = slide_index / total_slides
    draw.rectangle([(0, canvas_h - 6), (int(canvas_w * prog_pct), canvas_h)], fill=(6, 182, 212)) # Cyan fill

    canvas.save(output_path, quality=95)
    print(f"Generated slide: {output_path}")


def main():
    base_dir = Path(r"C:\Users\kaila\.gemini\antigravity-ide\brain\4484b298-f0af-4b45-9b31-f802d3ae6a4f")
    scratch_dir = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\scratch")
    slides_dir = scratch_dir / "slides"
    slides_dir.mkdir(parents=True, exist_ok=True)

    slides_info = [
        {
            "img": base_dir / "01_dashboard_initial_1789223812590.png",
            "badge": "MISSION BRIEFING",
            "title": "WEBODY: The Living Operating System for the Internet",
            "subtitle": "Pochiraju Kailash Ram Markandeya Sharma | Team kailashsharma | Closed-Loop Autonomous Intelligence",
            "duration": 35.0
        },
        {
            "img": base_dir / "02_world_model_graph_1789223824686.png",
            "badge": "LIVING WORLD MODEL",
            "title": "Continuous Spatial Graph & WebSocket Real-Time Telemetry",
            "subtitle": "Persistent temporal knowledge graph connecting competitive signals, market entities, and forecast trajectories",
            "duration": 23.0
        },
        {
            "img": base_dir / ".system_generated" / "click_feedback" / "click_feedback_1789223837016.png",
            "badge": "PHASE 1: OBSERVE",
            "title": "Sentinel Competitive Surveillance: Pricing Disruption Detected",
            "subtitle": "Autonomous web watcher triggers alert on Competitor X -22% enterprise tier price slash with SHA-256 fingerprint",
            "duration": 24.0
        },
        {
            "img": base_dir / "03_sentinel_diff_modal_1789223993215.png",
            "badge": "PHASE 2: UNDERSTAND",
            "title": "Cortex Multi-Source Deep Investigation & Verified Diff",
            "subtitle": "Agentic search cross-validates pricing diff, 40% compliance hiring surge, and EU AI Act regulatory deadlines",
            "duration": 32.0
        },
        {
            "img": base_dir / "04_rlhf_simulations_1789224134451.png",
            "badge": "PHASE 3 & 4: PREDICT/SIM",
            "title": "Oracle Bayesian Forecasting & Monte Carlo RLHF Strategy Tuning",
            "subtitle": "Calibrated 84% launch probability; executive RLHF sliders re-rank counter-pathways in real-time",
            "duration": 64.0
        },
        {
            "img": base_dir / "05_actions_wire_1789224159573.png",
            "badge": "PHASE 5: ACT (WIRE)",
            "title": "Autonomous Execution via Anakin Wire: github.issue.create",
            "subtitle": "Hands engine validates schema parameters and dispatches verified strategic countermeasures directly to backlog",
            "duration": 30.0
        },
        {
            "img": base_dir / "06_anakin_inspector_1789224272484.png",
            "badge": "ANAKIN FORGE SUITE",
            "title": "Full 8 Native Anakin Capability Suite & Enterprise Hardening",
            "subtitle": "Map, Crawl, Scrape, Search API, Agentic Search, Website Monitoring, AI Visibility, and Wire + SSRF Defense",
            "duration": 16.0
        },
        {
            "img": base_dir / "07_final_world_view_1789224313640.png",
            "badge": "CLOSING SUMMARY",
            "title": "WEBODY: Turning Web Chaos into Strategic Foresight & Action",
            "subtitle": "100% automated test pass (26/26) | Verified Live Operating System for the Internet | Thank You",
            "duration": 12.56
        }
    ]

    concat_file = scratch_dir / "concat_list.txt"
    with open(concat_file, "w", encoding="utf-8") as f:
        f.write("ffconcat version 1.0\n")
        for i, s in enumerate(slides_info, 1):
            slide_png = slides_dir / f"slide_{i:02d}.png"
            create_polished_slide(
                str(s["img"]),
                str(slide_png),
                s["badge"],
                s["title"],
                s["subtitle"],
                i,
                len(slides_info)
            )
            # Write into concat file using forward slashes
            clean_path = str(slide_png).replace("\\", "/")
            f.write(f"file '{clean_path}'\n")
            f.write(f"duration {s['duration']}\n")
        # Repeat last slide per ffconcat spec
        last_clean = str(slides_dir / f"slide_{len(slides_info):02d}.png").replace("\\", "/")
        f.write(f"file '{last_clean}'\n")

    print(f"Generated concat file at: {concat_file}")

    # Now encode with FFmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    audio_wav = scratch_dir / "webody_narration.wav"
    out_mp4 = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\artifacts\webody_live_demo_with_audio.mp4")
    brain_mp4 = base_dir / "webody_live_demo_with_audio.mp4"

    cmd = [
        ffmpeg,
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-i", str(audio_wav),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(out_mp4)
    ]

    print("Encoding master presentation video...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg Error:", res.stderr)
        raise RuntimeError("Failed to encode video")

    print(f"Master video created: {out_mp4} ({out_mp4.stat().st_size} bytes)")
    shutil.copy2(str(out_mp4), str(brain_mp4))
    print(f"Master video copied to brain: {brain_mp4}")

if __name__ == "__main__":
    main()
