import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Droplet } from "lucide-react";

interface ControlPanelProps {
  isWatering: boolean;
  isWebSocketConnected: boolean;
  onWateringClick: () => void;
}

export function ControlPanel({ isWatering, isWebSocketConnected, onWateringClick }: ControlPanelProps) {
  return (
    <Card className={`transition-colors ${isWatering ? "bg-blue-50 border-blue-200" : "bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100"}`}>
      <CardContent className="pt-6 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{isWatering ? "💧 Riego en Curso..." : "🌿 Estado del Sistema"}</h3>
          <p className="text-sm text-muted-foreground">
            {isWatering ? "Espere a que finalice" : isWebSocketConnected ? "Modo tiempo real activo" : "Modo polling activo"}
          </p>
        </div>
        <Button
          size="lg"
          onClick={onWateringClick}
          disabled={isWatering}
          className={`shadow-md transition-all ${isWatering ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {isWatering ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Droplet className="h-5 w-5 mr-2" />}
          {isWatering ? "Regando..." : "Activar Riego"}
        </Button>
      </CardContent>
    </Card>
  );
}