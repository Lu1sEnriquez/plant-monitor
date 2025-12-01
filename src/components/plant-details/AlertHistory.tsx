import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { PlantAlert } from "@/types";

interface AlertHistoryProps {
  alerts: PlantAlert[];
  isLoading?: boolean;
}

export function AlertHistory({ alerts, isLoading = false }: AlertHistoryProps) {
  
  // Helper para iconos y colores según severidad
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "CRITICA":
        return {
          icon: <ShieldAlert className="h-4 w-4" />,
          bg: "bg-red-50 border-red-100",
          iconBg: "bg-red-100 text-red-600",
          badge: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
        };
      case "ALERTA":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          bg: "bg-orange-50 border-orange-100",
          iconBg: "bg-orange-100 text-orange-600",
          badge: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100"
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          bg: "bg-blue-50 border-blue-100",
          iconBg: "bg-blue-100 text-blue-600",
          badge: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
        };
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="pb-3 border-b bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              Historial de Eventos
            </CardTitle>
            <CardDescription>Alertas registradas en la nube</CardDescription>
          </div>
          <Badge variant="outline" className="font-mono">
            {alerts.length} Total
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[300px] w-full p-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Cargando historial...</p>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <History className="h-8 w-8 opacity-20" />
              <p className="text-sm">No hay alertas registradas recientemente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const styles = getSeverityStyles(alert.severity);
                return (
                  <div 
                    key={alert.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${styles.bg}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${styles.iconBg}`}>
                      {styles.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles.badge}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                          {new Date(alert.timestamp).toLocaleString("es-MX", {
                             month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-snug">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Dato: {alert.value} • Métrica: {alert.metric}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}