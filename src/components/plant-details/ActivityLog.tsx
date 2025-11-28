import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "lucide-react";

// Puedes importar esta interfaz desde tu archivo types si prefieres, 
// pero como es UI-only la dejo aquí o en un archivo types.ts compartido.
export interface LogEntry {
  time: string;
  msg: string;
  type: "DATA" | "INFO" | "ALERT";
}

interface ActivityLogProps {
  logs: LogEntry[];
  isWebSocketConnected: boolean;
}

export function ActivityLog({ logs, isWebSocketConnected }: ActivityLogProps) {
  return (
    <Card className="h-[300px] flex flex-col shadow-sm border-slate-200">
      <CardHeader className="pb-2 border-b bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Bitácora de Sensores
            </CardTitle>
            <CardDescription>
              {isWebSocketConnected ? "Streaming en tiempo real" : "Lecturas recibidas"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {isWebSocketConnected ? "LIVE" : "POLLING"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col p-4 gap-2">
            {logs.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Esperando datos del dispositivo...
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={`text-xs font-mono p-2 rounded border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-1 ${
                  log.type === "INFO"
                    ? "bg-blue-50 border-blue-100 text-blue-700"
                    : log.type === "ALERT"
                    ? "bg-red-50 border-red-100 text-red-700"
                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold text-slate-400 min-w-[60px]">
                  {log.time}
                </span>
                <span className="flex-1 truncate">{log.msg}</span>
                {log.type === "DATA" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {log.type === "ALERT" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}