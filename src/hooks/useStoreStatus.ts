import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

function getBogotaTime() {
  const now = new Date();
  
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'long', 
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0';

  return {
    dayName: get('weekday'),
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  };
}

export function useStoreStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const scheduleData = await dataService.getSchedule();
        const { dayName, hour, minute } = getBogotaTime();
        const currentTimeInMinutes = hour * 60 + minute;

        const todayConfig = scheduleData.find(
          (item) => item.day.toLowerCase() === dayName.toLowerCase()
        );

        if (!todayConfig || !todayConfig.isOpen) {
          setIsOpen(false);
          return;
        }

        const [openH, openM] = todayConfig.startTime.split(':').map(Number);
        const [closeH, closeM] = todayConfig.endTime.split(':').map(Number);
        
        const openTimeInMinutes = openH * 60 + openM;
        const closeTimeInMinutes = closeH * 60 + closeM;

        if (closeTimeInMinutes < openTimeInMinutes) {
          setIsOpen(currentTimeInMinutes >= openTimeInMinutes || currentTimeInMinutes <= closeTimeInMinutes);
        } else {
          setIsOpen(currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes);
        }
      } catch (error) {
        console.error("Error calculando disponibilidad desde Sheets:", error);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
    
    const interval = setInterval(checkStatus, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  return { isOpen, loading };
}