"use client";

import { ReactNode } from 'react';
import GaugeComponent from 'react-gauge-component';

interface SmartGaugeProps {
  value: number;
  min: number;
  max: number;
  limitMin?: number;
  limitMax?: number;
  units: string;
  icon?: ReactNode;
  colors?: {
    low: string;
    optimal: string;
    high: string;
  };
}

export const SmartGauge = ({ 
  value, min, max, limitMin = 0, limitMax = 100, units, icon,
  colors = { low: '#EF4444', optimal: '#10B981', high: '#F59E0B' } 
}: SmartGaugeProps) => {

  // --- 1. LÓGICA DE PROTECCIÓN ---
  let safeMin = Math.max(limitMin, min);
  let safeMax = Math.min(limitMax, max);

  if (safeMin >= safeMax) safeMax = safeMin + 1;
  if (safeMax > limitMax) {
    safeMax = limitMax;
    safeMin = safeMax - 1;
  }

  // --- 2. LÓGICA DE TICKS ---
  const range = limitMax - limitMin;
  const minDistance = range * 0.10;

  const showMinTick = (safeMin - limitMin) > minDistance;
  const showMaxTick = (limitMax - safeMax) > minDistance;

  const myTicks = [];
  if (showMinTick) {
    myTicks.push({ value: min, valueConfig: { style: { fill: colors.low, fontSize: 10, fontWeight: 'bold' } } });
  }
  if (showMaxTick) {
    myTicks.push({ value: max, valueConfig: { style: { fill: colors.high, fontSize: 10, fontWeight: 'bold' } } });
  }

  // --- 3. ESTADO ACTUAL ---
  const isLow = value < min;
  const isHigh = value > max;
  
  let activeColor = colors.optimal;
  let statusText = "IDEAL";

  if (isLow) {
    activeColor = colors.low;
    statusText = "BAJO";
  } else if (isHigh) {
    activeColor = colors.high;
    statusText = "ALTO";
  }

  // --- 4. FORMATEO DE VALOR (Corrección Aquí) ---
  // Math.round(value) -> 69 (Entero)
  // value.toFixed(1) -> 69.0 (1 Decimal)
  // Elegimos 1 decimal si es temperatura, o entero para el resto, 
  // o simplemente usamos un redondeo inteligente:
  const formattedValue = Math.round(value * 10) / 10; // Mantiene máx 1 decimal (68.98 -> 69)

  return (
    <div className="flex flex-col items-center justify-center relative">
      
      <GaugeComponent
        type="semicircle"
        minValue={limitMin}
        maxValue={limitMax}
        value={value}
        marginInPercent={0.05}
        arc={{
          width: 0.2,
          padding: 0.005,
          cornerRadius: 1,
          subArcs: [
            { 
              limit: safeMin, 
              color: colors.low, 
              showTick: true, 
              tooltip: { text: `Bajo (<${min})` } 
            },
            { 
              limit: safeMax, 
              color: colors.optimal, 
              showTick: true, 
              tooltip: { text: `Óptimo (${min}-${max})` } 
            },
            { 
              color: colors.high, 
              tooltip: { text: `Alto (>${max})` } 
            }
          ]
        }}
        pointer={{
          color: '#334155',
          length: 0.80,
          width: 12,
        }}
        labels={{
          valueLabel: { hide: true }, 
          tickLabels: {
            type: "outer",
            defaultTickValueConfig: { 
               formatTextValue: (val) => Math.round(val).toString(), 
               style: { fontSize: 10, fill: '#94a3b8' } 
            },
            ticks: myTicks
          }
        }}
      />
      
      {/* --- BLOQUE DE TEXTO HTML --- */}
      <div className="flex flex-col items-center -mt-6 z-10">
        <span className="text-3xl font-bold text-slate-700 leading-none">
          {/* AQUÍ ESTÁ EL CAMBIO: Usamos formattedValue en vez de value */}
          {formattedValue}
          <span className="text-base font-normal text-slate-400 ml-0.5">{units}</span>
        </span>
        
        <div 
          className="flex items-center gap-1.5 mt-1 transition-colors duration-300"
          style={{ color: activeColor }} 
        >
          {icon && <span className="h-4 w-4">{icon}</span>}
          <span className="text-xs font-bold tracking-wider">{statusText}</span>
        </div>
      </div>

    </div>
  );
};