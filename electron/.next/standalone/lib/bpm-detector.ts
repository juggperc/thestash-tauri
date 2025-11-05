/**
 * BPM Detection utility using BeatDetektor
 * Based on https://github.com/cjcliffe/beatdetektor
 */

declare global {
  interface Window {
    BeatDetektor: any;
  }
}

let beatDetektorLoading: Promise<void> | null = null;

export async function detectBPM(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const loadBeatDetektor = (): Promise<void> => {
      // Reuse existing loading promise if already loading
      if (beatDetektorLoading) {
        return beatDetektorLoading;
      }

      if (window.BeatDetektor) {
        return Promise.resolve();
      }

      beatDetektorLoading = new Promise((scriptResolve, scriptReject) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="/lib/beatdetektor.js"]');
        if (existingScript) {
          // Wait for it to load
          existingScript.addEventListener('load', () => scriptResolve());
          existingScript.addEventListener('error', () => scriptReject(new Error('Failed to load BeatDetektor')));
          return;
        }

        const script = document.createElement('script');
        script.src = '/lib/beatdetektor.js';
        script.async = true;
        script.onload = () => {
          scriptResolve();
          beatDetektorLoading = null;
        };
        script.onerror = () => {
          scriptReject(new Error('Failed to load BeatDetektor'));
          beatDetektorLoading = null;
        };
        document.head.appendChild(script);
      });

      return beatDetektorLoading;
    };

    loadBeatDetektor()
      .then(() => {
        if (!window.BeatDetektor) {
          throw new Error('BeatDetektor not available');
        }
        return processAudio(file, resolve);
      })
      .catch((error) => {
        console.error('Error loading BeatDetektor:', error);
        beatDetektorLoading = null;
        resolve(null);
      });
  });
}

async function processAudio(file: File, resolve: (bpm: number | null) => void) {
  let audioContext: AudioContext | null = null;
  let tempContext: AudioContext | null = null;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create offline context for faster processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;

    source.connect(analyser);
    analyser.connect(offlineContext.destination);

    // Initialize BeatDetektor
    const bd = new window.BeatDetektor(60, 200);

    source.start(0);
    await offlineContext.startRendering();

    // Now process the audio buffer in real-time simulation
    tempContext = new AudioContext();
    const tempSource = tempContext.createBufferSource();
    tempSource.buffer = audioBuffer;
    
    const tempAnalyser = tempContext.createAnalyser();
    tempAnalyser.fftSize = 2048;
    tempAnalyser.smoothingTimeConstant = 0.3;
    
    tempSource.connect(tempAnalyser);
    tempAnalyser.connect(tempContext.destination);
    
    tempSource.start(0);
    
    const bufferLength = tempAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let currentTime = 0;
    const sampleRate = audioBuffer.sampleRate;
    const duration = Math.min(audioBuffer.duration, 30); // Process max 30 seconds
    const frameTime = 1 / 60; // 60fps processing
    
    let bestBPM = 0;
    let bestValue = 0;
    let frameCount = 0;
    const maxFrames = Math.floor(duration * 60);
    
    const processFrame = () => {
      try {
        if (!tempAnalyser || !tempContext) {
          if (tempContext) tempContext.close();
          if (audioContext) audioContext.close();
          resolve(null);
          return;
        }

        tempAnalyser.getByteFrequencyData(dataArray);
        
        // Convert to array for BeatDetektor
        const fftData = Array.from(dataArray);
        
        // Process with BeatDetektor
        bd.process(currentTime, fftData);
        
        // Check for best detection
        if (bd.win_bpm_int > 0 && bd.win_val > bestValue) {
          bestValue = bd.win_val;
          bestBPM = bd.win_bpm_int / 10.0;
        }
        
        currentTime += frameTime;
        frameCount++;
        
        // Early exit if we have a good detection
        if (bestValue > 25 && bestBPM >= 60 && bestBPM <= 200) {
          if (tempContext) tempContext.close();
          if (audioContext) audioContext.close();
          resolve(Math.round(bestBPM));
          return;
        }
        
        // Continue processing with setTimeout to avoid blocking UI
        if (frameCount < maxFrames && currentTime < duration) {
          setTimeout(processFrame, 16); // ~60fps, non-blocking
        } else {
          // Processing complete
          if (tempContext) tempContext.close();
          if (audioContext) audioContext.close();
          
          if (bestBPM > 0 && bestBPM >= 60 && bestBPM <= 200) {
            resolve(Math.round(bestBPM));
          } else {
            // Try with lower range
            tryLowerRange(audioBuffer, resolve);
          }
        }
      } catch (error) {
        console.error('Error in processFrame:', error);
        if (tempContext) tempContext.close();
        if (audioContext) audioContext.close();
        resolve(null);
      }
    };
    
    // Start processing
    setTimeout(() => {
      processFrame();
    }, 100);
    
  } catch (error) {
    console.error('Error detecting BPM:', error);
    if (audioContext) audioContext.close();
    if (tempContext) tempContext.close();
    resolve(null);
  }
}

async function tryLowerRange(audioBuffer: AudioBuffer, resolve: (bpm: number | null) => void) {
  let tempContext: AudioContext | null = null;
  
  try {
    tempContext = new AudioContext();
    const tempSource = tempContext.createBufferSource();
    tempSource.buffer = audioBuffer;
    
    const tempAnalyser = tempContext.createAnalyser();
    tempAnalyser.fftSize = 2048;
    tempAnalyser.smoothingTimeConstant = 0.3;
    
    tempSource.connect(tempAnalyser);
    tempAnalyser.connect(tempContext.destination);
    
    tempSource.start(0);
    
    const bd = new window.BeatDetektor(40, 100);
    const bufferLength = tempAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    let currentTime = 0;
    const duration = Math.min(audioBuffer.duration, 20);
    const frameTime = 1 / 60;
    const maxFrames = Math.floor(duration * 60);
    let frameCount = 0;
    
    const processFrame = () => {
      tempAnalyser.getByteFrequencyData(dataArray);
      const fftData = Array.from(dataArray);
      bd.process(currentTime, fftData);
      
      currentTime += frameTime;
      frameCount++;
      
      if (frameCount < maxFrames && currentTime < duration) {
        setTimeout(processFrame, 16); // ~60fps, non-blocking
      } else {
        if (tempContext) tempContext.close();
        const detectedBPM = bd.win_bpm_int / 10.0;
        if (detectedBPM > 0 && detectedBPM >= 40 && detectedBPM <= 100) {
          resolve(Math.round(detectedBPM));
        } else {
          resolve(null);
        }
      }
    };
    
    setTimeout(() => {
      processFrame();
    }, 100);
  } catch (error) {
    console.error('Error in tryLowerRange:', error);
    if (tempContext) tempContext.close();
    resolve(null);
  }
}
