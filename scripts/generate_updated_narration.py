import os
import subprocess
from pathlib import Path

def generate_updated_narration():
    script_text = (
        "Hello everyone and distinguished judges of the Anakin Forge Hackathon. "
        "My name is Pochiraju Kailash Ram Markandeya Sharma, team kailashsharma. "
        "Today, I am thrilled to present WEBODY 2.0 — The Living Operating System for the Internet, "
        "now fortified with an Autonomous Adversarial War Room and Multi-Platform Wire Action Studio. "
        
        "Modern enterprises and intelligence teams suffer from a fatal disconnect: "
        "scrapers email low-value DOM noise days late, while disconnected chatbots have no spatial memory and zero authority to execute countermeasures. "
        "WEBODY is fundamentally different. It is NOT a chatbot and NOT a single AI agent. "
        "It is an autonomous, persistent living world model that continuously executes the closed autonomous loop: "
        "OBSERVE, UNDERSTAND, PREDICT, SIMULATE, ACT, and LEARN. "
        
        "Observe our live command deck on screen. Notice our dynamic Rivalry Benchmark Selector in the header: "
        "executives can instantly simulate high-stakes market rivalries — from Anthropic versus OpenAI to Salesforce versus HubSpot — or monitor live custom domains. "
        
        "Now, let us trigger our live demonstration by clicking RUN THE FUTURE. "
        
        "Phase one: OBSERVE. Sentinel surveillance detects Competitor X suddenly slashing enterprise pricing by 22 percent and bundling governance features, verified with SHA-256 DOM fingerprinting. "
        
        "Phase two: UNDERSTAND. Cortex launches an investigation using Anakin Agentic Search, extracting three independent verified citations: the official pricing portal diff, a 40 percent surge in security and compliance job openings, and EU AI Act enforcement deadlines. "
        
        "Phase three: PREDICT. Oracle activates Bayesian forecasting, calibrated with historical precedents from Vector Memory and domain volatility from our Adaptive Governor, projecting an 84 percent probability of a major enterprise platform launch within thirty days. "
        
        "Phase four: SIMULATE. The Simulator evaluates strategic counter-pathways. When operators tune our interactive RLHF Strategy Sliders — adjusting Risk Aversion, Margin Defense, or Differentiation Priority — our reinforcement learning engine dynamically re-ranks the counter-measures in real-time. "
        
        "Next, we enter our breakthrough innovation: the Multi-Turn Adversarial War Room. "
        "Most agents evaluate strategies in a vacuum, but strategy is a game of chess. "
        "The War Room models sequential multi-turn dynamics over a 90-day horizon: "
        "Turn one: our Blue Team counter-move. Turn two: the competitor's retaliatory response. And Turn three: our 2nd-order equilibrium adaptation, locking in an outstanding 92 out of 100 market defensibility score. "
        
        "Phase five: ACT. Hands connects intelligence directly to reality through the Anakin Wire Action Studio. "
        "Operators and autonomous agents can dispatch verified countermeasures across five certified tools: GitHub, Slack, HubSpot CRM pipeline protection, Linear, and internal enterprise Webhooks, guarded by real-time schema validation and canary safety protocols. "
        
        "Phase six: LEARN. Confirmed external actions commit back to our persistent temporal timeline and world model graph. "
        
        "Finally, inspect our Cryptographic Forensic Audit Chain. Every phase is immutably linked with SHA-256 block hashes, guaranteeing zero hallucination, tamper-evident lineage, and full SOC2 and EU AI Act compliance. "
        
        "All eight native Anakin capabilities are seamlessly integrated. The system is hardened with SSRF defense and sliding-window rate limiting, and achieved 100 percent pass rate across 31 automated tests. "
        
        "WEBODY didn't tell you what happened. It figured out what it meant, what could happen next, and what to do about it. "
        "Thank you very much."
    )

    out_dir = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\scratch")
    out_dir.mkdir(parents=True, exist_ok=True)
    wav_path = out_dir / "webody_updated_narration.wav"

    clean_text = script_text.replace('"', '""')

    ps_code = f"""
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Rate = 0
    $synth.SetOutputToWaveFile('{str(wav_path)}')
    $synth.Speak("{clean_text}")
    $synth.Dispose()
    Write-Host "Updated audio generated at: {str(wav_path)}"
    """

    print("Synthesizing updated narration audio...")
    result = subprocess.run(["powershell", "-Command", ps_code], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("Stderr:", result.stderr)

    if wav_path.exists() and wav_path.stat().st_size > 1000:
        print(f"SUCCESS: Updated audio generated ({wav_path.stat().st_size} bytes)")
        # Copy to frontend public as well
        pub_path = Path(r"c:\Users\kaila\OneDrive\Desktop\Projects\WEBODY-Anakin-Hackathon\frontend\public\webody_narration.wav")
        import shutil
        shutil.copy2(str(wav_path), str(pub_path))
        print(f"Copied to public folder: {pub_path}")
        return str(wav_path)
    else:
        raise RuntimeError("Audio synthesis failed.")

if __name__ == "__main__":
    generate_updated_narration()
