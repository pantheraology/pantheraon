import { useState, useEffect } from 'react';

interface DeviceCapabilities {
  isLowEnd: boolean;
  isTouchDevice: boolean;
  supportsHaptics: boolean;
  connectionType: string;
  deviceMemory: number;
}

export const useDeviceCapability = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isLowEnd: false,
    isTouchDevice: false,
    supportsHaptics: false,
    connectionType: 'unknown',
    deviceMemory: 8,
  });

  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string };
    };

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const deviceMemory = nav.deviceMemory || 8;
    const connectionType = nav.connection?.effectiveType || 'unknown';
    
    // Consider device low-end if:
    // - Less than 4GB RAM
    // - Slow connection (2g, slow-2g)
    // - Hardware concurrency < 4
    const isLowEnd = 
      deviceMemory < 4 || 
      ['slow-2g', '2g'].includes(connectionType) ||
      navigator.hardwareConcurrency < 4;

    const supportsHaptics = 'vibrate' in navigator;

    setCapabilities({
      isLowEnd,
      isTouchDevice,
      supportsHaptics,
      connectionType,
      deviceMemory,
    });
  }, []);

  return capabilities;
};

// Utility to trigger haptic feedback
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 25,
      heavy: 50,
    };
    navigator.vibrate(patterns[type]);
  }
};
