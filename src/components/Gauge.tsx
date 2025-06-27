'use client';

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

type GaugeProps = {
  value: number;
  type: 'download' | 'upload' | 'ping' | 'idle';
};

const GAUGE_ARC_ANGLE = 270;
const GAUGE_START_ANGLE = -135;

const speedToAngle = (speed: number) => {
  const maxSpeed = 1000;
  // Use a logarithmic scale for better visualization of lower speeds
  const logSpeed = Math.log10(Math.min(speed, maxSpeed) + 1);
  const maxLogSpeed = Math.log10(maxSpeed + 1);
  const speedRatio = logSpeed / maxLogSpeed;
  return speedRatio * GAUGE_ARC_ANGLE + GAUGE_START_ANGLE;
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  // Prevent path errors for 0-length arcs
  if (endAngle === startAngle) {
    return "";
  }
  
  return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

const LABELS = [0, 5, 10, 50, 100, 250, 500, 750, 1000];

export const Gauge = ({ value, type }: GaugeProps) => {
  const angle = speedToAngle(value);
  
  return (
    <div className="relative w-full max-w-md mx-auto" aria-label="Speed test gauge">
      <svg viewBox="0 0 300 220" className="w-full">
        <defs>
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>

        {/* Background Arc */}
        <path
          d={describeArc(150, 150, 120, GAUGE_START_ANGLE, GAUGE_START_ANGLE + GAUGE_ARC_ANGLE)}
          fill="none"
          stroke="hsl(var(--card-foreground) / 0.1)"
          strokeWidth={20}
          strokeLinecap="round"
        />

        {/* Progress Arc */}
        {value > 0.01 && (
          <path
            d={describeArc(150, 150, 120, GAUGE_START_ANGLE, angle)}
            fill="none"
            stroke={type === 'upload' ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
            strokeWidth={20}
            strokeLinecap="round"
            style={{ transition: 'all 0.2s ease-out' }}
          />
        )}
        
        {/* Needle */}
        <g transform={`rotate(${angle}, 150, 150)`} style={{ transition: 'transform 0.2s ease-out' }}>
           <path d="M 150 150 L 150 50" stroke="white" strokeWidth="2" />
           <path d="M 150 150 L 150 80" stroke="url(#needleGradient)" strokeWidth="10" strokeLinecap="round" />
           <circle cx="150" cy="150" r="5" fill="white" />
        </g>
        
        {/* Labels */}
        <g className="text-muted-foreground fill-current text-sm">
          {LABELS.map(label => {
            const labelAngle = speedToAngle(label);
            const { x, y } = polarToCartesian(150, 150, 145, labelAngle);
            return (
              <text key={label} x={x} y={y} textAnchor="middle" dy="0.3em" className="text-xs sm:text-sm font-medium">
                {label}
              </text>
            )
          })}
        </g>

        {/* Digital Readout */}
        <text x="150" y="150" textAnchor="middle" className="text-6xl font-bold fill-current text-foreground">
           {value.toFixed(2)}
        </text>
        
        <g transform="translate(150, 180)">
            <foreignObject x="-50" y="0" width="100" height="30">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    {(type === 'download' || type === 'idle') && <ArrowDown className="w-5 h-5 text-primary" />}
                    {type === 'upload' && <ArrowUp className="w-5 h-5 text-accent" />}
                    <span>Mbps</span>
                </div>
            </foreignObject>
        </g>
      </svg>
    </div>
  );
};
