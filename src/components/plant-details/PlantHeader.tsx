import { ArrowLeft, Settings, Wifi, WifiOff, Waves, ThermometerSun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlantDevice, DeviceConfig } from "@/types";

interface PlantHeaderProps {
  deviceInfo: PlantDevice | null;
  plantId: string;
  isWebSocketConnected: boolean;
  webSocketRetries: number;
  lastUpdated: string;
  config: DeviceConfig;
  setConfig: (config: DeviceConfig) => void;
  onSaveConfig: () => void;
  isConfigOpen: boolean;
  setIsConfigOpen: (open: boolean) => void;
}

export function PlantHeader({
  deviceInfo,
  plantId,
  isWebSocketConnected,
  webSocketRetries,
  lastUpdated,
  config,
  setConfig,
  onSaveConfig,
  isConfigOpen,
  setIsConfigOpen
}: PlantHeaderProps) {
  
  const getWebSocketStatusColor = () => {
    if (isWebSocketConnected) return "text-emerald-500";
    if (webSocketRetries > 3) return "text-red-500";
    return "text-yellow-500";
  };

  const getWebSocketStatusText = () => {
    if (isWebSocketConnected) return "CONECTADO";
    if (webSocketRetries > 3) return "FALLIDO";
    return "RECONECTANDO";
  };

  return (
    <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-20 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                {deviceInfo?.name || plantId}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground font-mono">ID: {plantId}</p>
                <Badge variant={deviceInfo?.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                  {deviceInfo?.isActive ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Estado WebSocket */}
            <div className="flex items-center gap-2">
              {isWebSocketConnected ? (
                <Wifi className={`h-4 w-4 ${getWebSocketStatusColor()}`} />
              ) : (
                <WifiOff className={`h-4 w-4 ${getWebSocketStatusColor()}`} />
              )}
              <Badge variant={isWebSocketConnected ? "default" : "secondary"} className="text-[10px] h-5">
                {getWebSocketStatusText()}
              </Badge>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {isWebSocketConnected ? "Actualizado LIVE" : "Actualizado"}
              </p>
              <p className="text-xs font-medium tabular-nums">{lastUpdated}</p>
            </div>

            {/* Modal Configuración */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Configuración de Umbrales</DialogTitle>
                  <DialogDescription>Define los rangos ideales para las alertas automáticas.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Inputs de Humedad */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Waves className="h-4 w-4 text-blue-500" /> Humedad Suelo (%)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mínimo (Riego)</Label>
                        <Input type="number" value={config.minSoilHumidity} onChange={(e) => setConfig({ ...config, minSoilHumidity: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Máximo</Label>
                        <Input type="number" value={config.maxSoilHumidity} onChange={(e) => setConfig({ ...config, maxSoilHumidity: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                  {/* Inputs de Temperatura */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-red-500" /> Temperatura (°C)
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mínima</Label>
                        <Input type="number" value={config.minTempC} onChange={(e) => setConfig({ ...config, minTempC: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Máxima</Label>
                        <Input type="number" value={config.maxTempC} onChange={(e) => setConfig({ ...config, maxTempC: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={onSaveConfig} className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar Cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}