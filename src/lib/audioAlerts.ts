/**
 * Tactical audio synthesizer using browser Web Audio API.
 * Requires 0 external audio files/assets — works 100% offline.
 */
class TacticalAudioAlerts {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  /**
   * High-priority Emergency SOS / Replanning warning tone.
   */
  public playReplanningAlert(): void {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      // Dual beep alarm
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Hospital Divert warning chime.
   */
  public playDivertAlert(): void {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Positive match found / dispatch acknowledged tone.
   */
  public playSuccessChime(): void {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Futuristic tactical ping for AI Copilot consultation.
   */
  public playTacticalPing(): void {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(1046.5, now + 0.08); // C6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const audioAlerts = new TacticalAudioAlerts();
