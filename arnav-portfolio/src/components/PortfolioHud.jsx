import { useEffect, useRef } from 'react';
import { motion, useTransform } from 'framer-motion';

export function PortfolioClock() {
  const ref = useRef(null);
  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const update = () => {
      if (ref.current && !document.hidden) ref.current.textContent = format.format(new Date());
    };
    update();
    const timer = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <span ref={ref} data-portfolio-clock="" className="tabular-nums" aria-label="Current time in India" />;
}

export function ScrollPercentage({ progress }) {
  const label = useTransform(progress, value => `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`);
  return <motion.span data-scroll-percentage="" className="tabular-nums" aria-label="Page scroll percentage">{label}</motion.span>;
}
