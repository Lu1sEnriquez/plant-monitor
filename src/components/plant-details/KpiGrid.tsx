import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ThermometerSun, Waves, CloudRain, Sun } from "lucide-react";
import { KpiDto, DeviceConfig } from "@/types";

interface KpiGridProps {
  kpi: KpiDto;
  config: DeviceConfig;
  currentAmbientHum: number;
}

export function KpiGrid({ kpi, config, currentAmbientHum }: KpiGridProps) {
  // Helpers visuales internos
  const getHealthColor = (health: number) => {
    if (health > 80) return "text-emerald-500";
    if (health > 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBgColor = (health: number) => {
    if (health > 80) return "bg-emerald-500";
    if (health > 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLightDescription = (lux: number) => {
    if (lux < 100) return "Muy Oscuro";
    if (lux < 500) return "Baja Luz";
    if (lux < 1000) return "Luz Media";
    if (lux < 5000) return "Brillante";
    return "Sol Directo";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* ESI */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest">Salud General (ESI)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <span className={`text-4xl font-bold ${getHealthColor(kpi.healthIndex)}`}>{kpi.healthIndex}%</span>
            <span className="text-sm font-medium text-muted-foreground mb-1">
              {kpi.healthIndex > 80 ? "Excelente" : "Atención"}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className={`h-full ${getHealthBgColor(kpi.healthIndex)}`} style={{ width: `${kpi.healthIndex}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* DQR */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Shield className="h-3 w-3" /> Calidad Datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-blue-600">{kpi.dataQuality}%</span>
            <span className="text-sm text-muted-foreground mb-1">Fiabilidad</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">Lecturas válidas recibidas</div>
        </CardContent>
      </Card>

      {/* Temperatura */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <ThermometerSun className="h-3 w-3" /> Temperatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-800">{kpi.currentTemp.toFixed(1)}°C</div>
          <div className="text-xs text-muted-foreground mt-2">Ambiente</div>
        </CardContent>
      </Card>

      {/* Humedad Suelo */}
      <Card className={kpi.currentSoil < config.minSoilHumidity ? "border-red-400 bg-red-50" : ""}>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Waves className="h-3 w-3" /> Suelo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className={`text-4xl font-bold ${kpi.currentSoil < config.minSoilHumidity ? "text-red-600" : "text-teal-600"}`}>
              {kpi.currentSoil}%
            </span>
            {kpi.currentSoil < config.minSoilHumidity && (
              <Badge variant="destructive" className="animate-pulse">SECO</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Meta: {config.minSoilHumidity}% - {config.maxSoilHumidity}%
          </div>
        </CardContent>
      </Card>

      {/* Humedad Aire */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <CloudRain className="h-3 w-3" /> Humedad Aire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-400">{currentAmbientHum}%</div>
          <div className="text-xs text-muted-foreground mt-2">Relativa</div>
        </CardContent>
      </Card>

      {/* Luz */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Sun className="h-3 w-3" /> Luz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-orange-500">
            {kpi.currentLight} <span className="text-lg text-muted-foreground font-normal">lx</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{getLightDescription(kpi.currentLight)}</div>
        </CardContent>
      </Card>
    </div>
  );
}