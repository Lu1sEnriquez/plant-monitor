"use client";

import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { 
  Database, ThermometerSun, Waves, CloudRain, Sun, Droplets, Thermometer, Signal, SignalHigh, SignalLow, AlertOctagon
} from "lucide-react";
import { KpiDto, DeviceConfig } from "@/types"; 
import { SmartGauge } from "./SmartGauge"; 

interface KpiGridProps {
  kpi: KpiDto;
  config: DeviceConfig; 
  currentAmbientHum: number;
}

// --- SUB-COMPONENTE: GRÁFICO DE ANILLO MEJORADO PARA CALIDAD DE DATOS ---
const QualityRing = ({ value }: { value: number }) => {
  const roundedValue = Math.round(value);
  
  // Configuración del SVG
  const radius = 45; // Un poco más grande para impactar
  const strokeWidth = 8; 
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (roundedValue / 100) * circumference;
  
  // Lógica de Estado (Colores, Textos e Íconos dinámicos)
  // Asumimos que 100% es perfecto y 0% es desconectado.
  let status = {
    color: "text-red-500",
    bgColor: "bg-red-50",
    ringColor: "text-red-500",
    text: "Crítica",
    icon: <AlertOctagon className="h-4 w-4 mb-1" />
  };

  if (roundedValue >= 95) {
    status = { color: "text-emerald-600", bgColor: "bg-emerald-50", ringColor: "text-emerald-500", text: "Excelente", icon: <SignalHigh className="h-4 w-4 mb-1" /> };
  } else if (roundedValue >= 80) {
    status = { color: "text-blue-600", bgColor: "bg-blue-50", ringColor: "text-blue-500", text: "Buena", icon: <Signal className="h-4 w-4 mb-1" /> };
  } else if (roundedValue >= 50) {
    status = { color: "text-amber-600", bgColor: "bg-amber-50", ringColor: "text-amber-500", text: "Inestable", icon: <SignalLow className="h-4 w-4 mb-1" /> };
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-sm">
          {/* Círculo de fondo (pista sutil) */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            className="text-slate-100"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Círculo de progreso (color dinámico) */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${status.ringColor}`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Texto Central */}
        <div className="absolute flex flex-col items-center justify-center inset-0">
          <span className={`text-3xl font-black tracking-tight ${status.color}`}>
            {roundedValue}%
          </span>
        </div>
      </div>

      {/* Estado e Ícono debajo del anillo */}
      <div className={`mt-3 flex flex-col items-center justify-center py-1.5 px-4 rounded-full ${status.bgColor} ${status.color}`}>
        {status.icon}
        <span className="text-xs font-bold uppercase tracking-widest leading-none">
          {status.text}
        </span>
      </div>
    </div>
  );
};

export function KpiGrid({ kpi, config, currentAmbientHum }: KpiGridProps) {

  return (
    <div className="space-y-4">
      
      {/* --- GRID ADAPTATIVO --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* 1. TEMPERATURA (Sin cambios) */}
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <ThermometerSun className="h-3 w-3" /> Temperatura
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SmartGauge 
              value={kpi.currentTemp}
              min={config.minTempC ?? 15} 
              max={config.maxTempC ?? 30} 
              limitMin={0} limitMax={50} units="°C"
              icon={<Thermometer />}
              colors={{ low: '#3B82F6', optimal: '#10B981', high: '#EF4444' }}
            />
            <div className="text-[10px] text-center text-muted-foreground mt-2">
               Ideal: {config.minTempC}° - {config.maxTempC}°
            </div>
          </CardContent>
        </Card>

        {/* 2. HUMEDAD SUELO (Sin cambios) */}
        <Card className={kpi.currentSoil < (config.minSoilHumidity ?? 0) ? "border-red-400 bg-red-50/30" : ""}>
          <CardHeader className="p-4 pb-0">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Waves className="h-3 w-3" /> Humedad Suelo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SmartGauge 
              value={kpi.currentSoil}
              min={config.minSoilHumidity ?? 30}
              max={config.maxSoilHumidity ?? 70}
              limitMin={0} limitMax={100} units="%"
              icon={<Droplets />}
              colors={{ low: '#EF4444', optimal: '#10B981', high: '#3B82F6' }}
            />
             <div className="text-[10px] text-center text-muted-foreground mt-2">
               Riego crítico: {config.minSoilHumidity}%
            </div>
          </CardContent>
        </Card>

        {/* 3. HUMEDAD AMBIENTAL (Sin cambios) */}
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <CloudRain className="h-3 w-3" /> Humedad Aire
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SmartGauge 
              value={currentAmbientHum}
              min={config.minHumidity ?? 40} 
              max={config.maxHumidity ?? 80} 
              limitMin={0} limitMax={100} units="%"
              icon={<CloudRain />}
            />
             <div className="text-[10px] text-center text-muted-foreground mt-2">
               Entorno Ambiente
            </div>
          </CardContent>
        </Card>

        {/* 4. LUZ (Sin cambios) */}
        <Card>
          <CardHeader className="p-4 pb-0">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Sun className="h-3 w-3" /> Luz
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <SmartGauge 
              value={kpi.currentLight}
              min={config.minLightLux ?? 500}
              max={config.maxLightLux ?? 2000}
              limitMin={0} limitMax={5000} units=" lx"
              icon={<Sun />}
              colors={{ low: '#94A3B8', optimal: '#FBBF24', high: '#F97316' }}
            />
             <div className="text-[10px] text-center text-muted-foreground mt-2">
               Intensidad Lumínica
            </div>
          </CardContent>
        </Card>

        {/* 5. CALIDAD DE DATOS (MEJORADA) */}
        <Card>
          <CardHeader className="p-4 pb-0">
            {/* Usamos el ícono de Base de Datos o Señal */}
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
              <Database className="h-3 w-3 text-slate-500" /> Calidad de Datos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 flex flex-col items-center">
            
            {/* Componente de anillo mejorado */}
            <QualityRing value={kpi.dataQuality} />
            
             <div className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
               Integridad de la señal IoT
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}