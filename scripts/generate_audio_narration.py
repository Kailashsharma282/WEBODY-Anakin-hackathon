import os
import subprocess
from pathlib import Path

def generate_narration():
    script_text = (
        "Hello everyone and distinguished judges of the Anakin Forge Hackathon. "
        "My name is Pochiraju Kailash Ram Markandeya Sharma, team kailashsharma. "
        "Today, I am proud to present WEBODY — The Living Operating System for the Internet. "
        
        "Modern enterprises and competitive intelligence teams suffer from a fatal disconnect between web surveillance and action. "
        "Scraping tools merely email low-value DOM noise days late, while disconnected chatbots have no spatial memory and zero authority to execute countermeasures. "
        
        "WEBODY is fundamentally different. It is NOT a chatbot and NOT a single AI agent. "
        "It is an autonomous, persistent living world model that continuously executes the closed autonomous loop: "
        "OBSERVE, UNDERSTAND, PREDICT, SIMULATE, ACT, and LEARN. "
        
        "Let us observe the live system dashboard. In the top navigation bar, notice our live WebSocket telemetry sync, "
        "system metrics tracking tracked market entities, active signals, probabilistic forecasts, and strategic opportunities. "
        
        "Now, let us trigger our live deterministic demonstration by clicking RUN THE FUTURE. "
        
        "Phase one: OBSERVE. Sentinel monitors competitive domains and captures a critical market signal: "
        "Competitor X has suddenly slashed enterprise pricing by 22 percent and bundled governance features. "
        
        "Phase two: UNDERSTAND. Rather than simply alerting, Cortex initiates an investigation using Anakin Agentic Search. "
        "It extracts three independent verified evidence citations: the official pricing portal diff, a 40 percent surge in security and compliance job openings, and EU AI Act enforcement deadlines. "
        
        "Phase three: PREDICT. Oracle activates Bayesian forecasting. By analyzing domain volatility from our Adaptive Governor and historical precedents from Vector Memory, "
        "it calculates an 84 percent calibrated probability that Competitor X will launch a broader enterprise platform within thirty days. "
        
        "Phase four: SIMULATE. The Simulator evaluates three strategic counter-pathways: "
        "Scenario A, Do Nothing, carries high churn risk. "
        "Scenario B, Match Price, triggers margin compression. "
        "Scenario C, Differentiate with Governance Bundle, scores 94 out of 100 with 92 percent net benefit. "
        "Notice our interactive RLHF Strategy Sliders: when executive operators adjust Risk Aversion, Margin Defense, or Differentiation Priority, "
        "our reinforcement learning engine re-ranks the scenarios in real-time. "
        
        "Phase five: ACT. Hands connects simulation to reality via Anakin Wire. "
        "It discovers the Wire catalog, validates parameters, and executes github.issue.create, "
        "dispatching a verified priority strategic countermeasure directly into the engineering backlog with zero human friction. "
        
        "Phase six: LEARN. The confirmed external action is committed back into our persistent temporal timeline and world model graph. "
        
        "All eight official Anakin products are natively integrated: Map, Crawl, Scrape, Search API, Agentic Search, Website Monitoring, AI Visibility, and Wire. "
        "The system is fortified with enterprise SSRF defense, sliding-window rate limiting, HTTP security headers, and achieved 100 percent pass rate across 26 automated tests. "
        
        "WEBODY didn't tell you what happened. It figured out what it meant, what could happen next, and what to do about it. "
        "Thank you very much."
    )

    out_dir = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\scratch")
    out_dir.mkdir(parents=True, exist_ok=True)
    wav_path = out_dir / "webody_narration.wav"

    # Escape quotes for PowerShell
    clean_text = script_text.replace('"', '""')

    ps_code = f"""
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Rate = 0
    $synth.SetOutputToWaveFile('{str(wav_path)}')
    $synth.Speak("{clean_text}")
    $synth.Dispose()
    Write-Host "Audio generated at: {str(wav_path)}"
    """

    print("Synthesizing live audio narration...")
    result = subprocess.run(["powershell", "-Command", ps_code], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("Stderr:", result.stderr)

    if wav_path.exists() and wav_path.stat().st_size > 1000:
        print(f"SUCCESS: Audio generated ({wav_path.stat().st_size} bytes)")
        return str(wav_path)
    else:
        raise RuntimeError("Audio synthesis failed.")

if __name__ == "__main__":
    generate_narration()
