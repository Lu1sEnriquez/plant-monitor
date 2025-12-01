"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CombinedHistoryData, ClusteringPiePoint } from "@/types";

interface ChartsSectionProps {
  historyData: CombinedHistoryData[];
  clusteringData: ClusteringPiePoint[];
  timePeriod: string;
  setTimePeriod: (value: string) => void;
  isWebSocketConnected: boolean;
}

export function ChartsSection({
  historyData,
  clusteringData,
  timePeriod,
  setTimePeriod,
  isWebSocketConnected,
}: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <Card className="lg:col-span-2 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Historial Ambiental</CardTitle>
            <CardDescription>
              {isWebSocketConnected
                ? "Datos en tiempo real"
                : "Tendencias históricas"}
            </CardDescription>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hora</SelectItem>
              <SelectItem value="3h">3 Horas</SelectItem>
              <SelectItem value="6h">6 Horas</SelectItem>
              <SelectItem value="12h">12 Horas</SelectItem>
              <SelectItem value="24h">24 Horas</SelectItem>
              <SelectItem value="3d">3 Días</SelectItem>
              <SelectItem value="7d">7 Días</SelectItem>
              <SelectItem value="30d">30 Días</SelectItem>
              <SelectItem value="90d">3 Meses</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          <Tabs defaultValue="env" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="env">Clima (Temp/Aire)</TabsTrigger>
              <TabsTrigger value="growth">Recursos (Suelo/Luz)</TabsTrigger>
            </TabsList>

            <TabsContent value="env" className="flex-1 h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    fontSize={10}
                    tickMargin={10}
                    stroke="#888"
                  />
                  <YAxis
                    fontSize={10}
                    stroke="#888"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "#666" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />

                  {/* --- CORRECCIÓN AQUÍ: Agregado connectNulls --- */}
                  <Line
                    connectNulls
                    type="monotone"
                    dataKey="temp"
                    name="Temp (°C)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    connectNulls
                    type="monotone"
                    dataKey="ambientHum"
                    name="Humedad Aire (%)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="growth" className="flex-1 h-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="time"
                    fontSize={10}
                    tickMargin={10}
                    stroke="#888"
                  />
                  <YAxis
                    yAxisId="left"
                    fontSize={10}
                    stroke="#14b8a6"
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={10}
                    stroke="#f97316"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />

                  {/* --- CORRECCIÓN AQUÍ: Agregado connectNulls --- */}
                  <Line
                    connectNulls
                    yAxisId="left"
                    type="monotone"
                    dataKey="soilHum"
                    name="Humedad Suelo (%)"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    connectNulls
                    yAxisId="right"
                    type="monotone"
                    dataKey="light"
                    name="Luz (Lux)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Clustering */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">Análisis Semanal</CardTitle>
          <CardDescription>Distribución de estados (ML)</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px] flex flex-col items-center justify-center">
          {clusteringData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={clusteringData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Un poco más fino el anillo
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {clusteringData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-10">
              Recopilando datos para análisis...
            </div>
          )}
          <div className="w-full mt-4 space-y-3 px-4">
            {clusteringData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs border-b pb-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-md shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="capitalize font-medium text-slate-700">
                    {item.name.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                  {item.value} lecturas
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
