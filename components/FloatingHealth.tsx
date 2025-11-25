import React, { useEffect, useState } from 'react';

interface FloatingHealthProps {
  val: number; // Positive for health gain, negative for health loss
  x: number;
  y: number;
  onComplete: () => void;
}

export const FloatingHealth: React.FC<FloatingHealthProps> = ({ val, x, y, onComplete }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const isPositive = val > 0;
  const text = isPositive ? `+${val}` : `${val}`;
  const color = isPositive ? 'text-green-500' : 'text-red-500';

  return (
    <div 
      className={`fixed pointer-events-none z-50 text-3xl font-black ${color} drop-shadow-lg`}
      style={{ 
        left: x, 
        top: y,
        animation: 'floatUpHealth 1s ease-out forwards'
      }}
    >
      {text}
      <style>{`
        @keyframes floatUpHealth {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
            100% { transform: translateY(-80px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

