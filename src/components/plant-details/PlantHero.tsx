"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, CheckCircle2, AlertTriangle, XCircle, Droplets, WifiOff 
} from "lucide-react";
import { KpiDto } from "@/types";

interface PlantHeroProps {
  kpi: KpiDto;
  isWatering: boolean;
  onWateringClick: () => void;
  isWebSocketConnected: boolean;
}

export function PlantHero({ 
  kpi, 
  isWatering, 
  onWateringClick, 
  isWebSocketConnected 
}: PlantHeroProps) {

  // --- LÓGICA DE ESTILOS (Encapsulada aquí) ---
  const getEsiStyles = (health: number) => {
    if (health > 80) return {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
      text: "text-emerald-800",
      bar: "bg-emerald-500",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
      icon: <CheckCircle2 className="h-20 w-20 text-emerald-600 opacity-20 absolute -right-2 -bottom-2 rotate-12" />,
      label: "Excelente",
      desc: "La planta está en condiciones óptimas."
    };
    if (health > 50) return {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
      text: "text-amber-800",
      bar: "bg-amber-500",
      btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200",
      icon: <AlertTriangle className="h-20 w-20 text-amber-600 opacity-20 absolute -right-2 -bottom-2 rotate-12" />,
      label: "Regular",
      desc: "Revisa los parámetros, algo no está ideal."
    };
    return {
      bg: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
      text: "text-red-800",
      bar: "bg-red-500",
      btn: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
      icon: <XCircle className="h-20 w-20 text-red-600 opacity-20 absolute -right-2 -bottom-2 rotate-12" />,
      label: "Crítico",
      desc: "Acción inmediata requerida."
    };
  };

  const esiStyle = getEsiStyles(kpi.healthIndex);

  return (
    <Card className={`${esiStyle.bg} border shadow-sm transition-all duration-300 relative overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 z-10 relative">
          
          {/* SECCIÓN 1: Título y Score */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="p-3 bg-white/60 rounded-full shadow-sm backdrop-blur-sm">
              <Activity className={`h-8 w-8 ${esiStyle.text}`} />
            </div>
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${esiStyle.text} opacity-80`}>
                Índice de Salud General (ESI)
              </h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-extrabold ${esiStyle.text}`}>
                  {kpi.healthIndex}%
                </span>
                <Badge variant="outline" className={`bg-white/50 ${esiStyle.text} border-transparent font-bold`}>
                  {esiStyle.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Barra de Progreso (Flexible) */}
          <div className="flex-1 w-full lg:px-8">
            <div className="flex justify-between text-xs font-medium mb-1 opacity-70">
              <span>0%</span>
              <span className="hidden sm:inline">Estado Actual</span>
              <span>100%</span>
            </div>
            <div className="h-4 w-full bg-black/5 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-full ${esiStyle.bar} transition-all duration-1000 ease-out`} 
                style={{ width: `${kpi.healthIndex}%` }} 
              />
            </div>
            <p className="text-xs mt-2 text-muted-foreground font-medium italic">
              {esiStyle.desc}
            </p>
          </div>

          {/* SECCIÓN 3: Botón de Acción (Riego) */}
          <div className="w-full lg:w-auto flex flex-col items-end gap-2">
             <Button 
                size="lg"
                onClick={onWateringClick}
                disabled={isWatering || !isWebSocketConnected}
                className={`w-full lg:w-auto font-bold shadow-lg transition-all active:scale-95 ${esiStyle.btn}`}
             >
                {isWatering ? (
                  <>
                    <Droplets className="mr-2 h-5 w-5 animate-bounce" />
                    Regando...
                  </>
                ) : (
                  <>
                    <Droplets className="mr-2 h-5 w-5" />
                    Activar Riego
                  </>
                )}
             </Button>
             
             {/* Aviso si está desconectado */}
             {!isWebSocketConnected && (
               <div className="flex items-center gap-1 text-[10px] text-red-500 bg-white/50 px-2 py-1 rounded-full">
                 <WifiOff className="h-3 w-3" />
                 <span>Offline</span>
               </div>
             )}
          </div>

        </div>
        
        {/* Decoración de fondo */}
        {esiStyle.icon}
      </CardContent>
    </Card>
  );
}