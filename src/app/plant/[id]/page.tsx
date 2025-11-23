"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation" // <--- IMPORTANTE: useParams
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Droplet,
  ThermometerSun,
  Waves,
  Shield,
  Settings,
  CloudRain,
  Sun,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
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
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Servicios y Tipos
import { apiService } from "@/services/apiService"
import { 
  KpiDto, 
  PlantDevice, 
  DeviceCommand, 
  CombinedHistoryData, 
  ClusteringPiePoint 
} from "@/types"

export default function PlantDetailPage() {
  // 1. OBTENCIÓN SEGURA DEL ID (Cliente)
  const params = useParams()
  const plantId = params.id as string // Casting seguro porque la ruta siempre lo trae
  const router = useRouter()
  
  // --- ESTADOS ---
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("Cargando...")
  const [timePeriod, setTimePeriod] = useState("24h")
  
  // Datos Reales (Tipados)
  const [kpiData, setKpiData] = useState<KpiDto | null>(null)
  const [historyData, setHistoryData] = useState<CombinedHistoryData[]>([]) 
  const [clusteringData, setClusteringData] = useState<ClusteringPiePoint[]>([])
  const [deviceInfo, setDeviceInfo] = useState<PlantDevice | null>(null)

  // Configuración (Modal)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [config, setConfig] = useState({
    minSoilHumidity: 35,
    maxSoilHumidity: 100,
    minTempC: -5,
    maxTempC: 38,
    minLightLux: 200,
    maxLightLux: 50000,
  })

  // 2. Verificar Sesión
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(storedUser)
    }
  }, [router])

  // 3. Función de Carga de Datos (Centralizada)
  const loadData = useCallback(async () => {
    // Evitar ejecutar si no hay usuario o ID aún
    if (!user || !plantId) return

    try {
      // A. Obtener Info del Dispositivo (Metadatos y Configuración)
      // Lo hacemos en paralelo con los KPIs para que sea más rápido
      const [devices, kpis] = await Promise.all([
        apiService.getDevices(),
        apiService.getPlantKPIs(plantId)
      ])

      const myDevice = devices.find((d) => d.plantId === plantId)
      if (myDevice) {
        setDeviceInfo(myDevice)
        // Rellenar modal con valores actuales de la DB
        setConfig({
          minSoilHumidity: myDevice.minSoilHumidity ?? 35,
          maxSoilHumidity: myDevice.maxSoilHumidity ?? 100,
          minTempC: myDevice.minTempC ?? -5,
          maxTempC: myDevice.maxTempC ?? 38,
          minLightLux: myDevice.minLightLux ?? 200,
          maxLightLux: myDevice.maxLightLux ?? 50000,
        })
      }

      // B. Setear KPIs
      setKpiData(kpis)
      setLastUpdated(new Date().toLocaleTimeString())

      // C. Historial (Gráficas Combinadas)
      try {
        const history = await apiService.getHistoryCombined(plantId, timePeriod) 
        setHistoryData(history)
      } catch (e) {
        console.warn("No hay historial disponible")
        setHistoryData([]) 
      }

      // D. Clustering (Pastel)
      try {
        const clusters = await apiService.getClustering(plantId, "7d") // Siempre pedimos 7d para análisis robusto
        const chartClusters: ClusteringPiePoint[] = Object.entries(clusters.clusters).map(([key, value]) => ({
          name: key,
          value: value,
          color: key.includes("SECO") ? "#ef4444" : key.includes("OPTIMO") ? "#10b981" : "#3b82f6",
        }))
        setClusteringData(chartClusters)
      } catch (e) {
        setClusteringData([])
      }

    } catch (error) {
      console.error("Error cargando datos:", error)
      toast.error("Error de conexión con el dispositivo")
    } finally {
      setIsLoading(false)
    }
  }, [user, plantId, timePeriod])

  // 4. Efecto de Polling (Refresco automático cada 5s)
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])


  // --- HANDLERS DE ACCIÓN ---

  const handleWatering = async () => {
    if (!plantId) return
    try {
      await apiService.sendCommand(plantId, DeviceCommand.RIEGO)
      toast.success("Comando Enviado: RIEGO", {
        description: "La bomba se activará por unos segundos.",
      })
      // Esperar un poco y recargar para ver cambios
      setTimeout(loadData, 2000)
    } catch (error) {
      toast.error("Error al enviar comando")
    }
  }

  const handleSaveConfig = async () => {
    if (!plantId) return
    try {
      await apiService.updateConfig(plantId, config)
      toast.success("Configuración Guardada")
      setIsConfigOpen(false)
      loadData() // Recargar para asegurar sincronía
    } catch (error) {
      toast.error("Error al guardar configuración")
    }
  }

  // --- HELPERS VISUALES ---

  const getHealthColor = (health: number) => {
    if (health > 80) return "text-emerald-500"
    if (health > 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getHealthBgColor = (health: number) => {
    if (health > 80) return "bg-emerald-500"
    if (health > 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getLightDescription = (lux: number) => {
    if (lux < 100) return "Muy Oscuro"
    if (lux < 500) return "Baja Luz"
    if (lux < 1000) return "Luz Media"
    if (lux < 5000) return "Brillante"
    return "Sol Directo"
  }

  // --- RENDERIZADO ---

  if (!user) return null

  if (isLoading && !kpiData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-muted-foreground">Cargando datos de {plantId}...</p>
        </div>
      </div>
    )
  }

  // Datos seguros para evitar crashes
  const safeKpi = kpiData || { 
    currentTemp: 0, currentSoil: 0, healthIndex: 0, dataQuality: 0, currentLight: 0, lastUpdate: "" 
  }
  
  // Sacamos la humedad ambiental del historial si no viene en KPI (para completar las 6 tarjetas)
  const lastHistoryPoint = historyData.length > 0 ? historyData[historyData.length - 1] : null;
  const currentAmbientHum = lastHistoryPoint?.ambientHum || 0;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header Sticky */}
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
                <h1 className="text-xl font-bold sm:text-2xl">{deviceInfo?.name || plantId}</h1>
                <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground font-mono">ID: {plantId}</p>
                    <Badge variant={deviceInfo?.isActive ? "default" : "secondary"} className="text-[10px] h-5">
                        {deviceInfo?.isActive ? "Online" : "Offline"}
                    </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Actualizado</p>
                <p className="text-xs font-medium tabular-nums">{lastUpdated}</p>
              </div>
              
              {/* Botón Configuración */}
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
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <Waves className="h-4 w-4 text-blue-500"/> Humedad Suelo (%)
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mínimo (Riego)</Label><Input type="number" value={config.minSoilHumidity} onChange={(e) => setConfig({...config, minSoilHumidity: Number(e.target.value)})} /></div>
                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Máximo</Label><Input type="number" value={config.maxSoilHumidity} onChange={(e) => setConfig({...config, maxSoilHumidity: Number(e.target.value)})} /></div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <ThermometerSun className="h-4 w-4 text-red-500"/> Temperatura (°C)
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Mínima</Label><Input type="number" value={config.minTempC} onChange={(e) => setConfig({...config, minTempC: Number(e.target.value)})} /></div>
                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Máxima</Label><Input type="number" value={config.maxTempC} onChange={(e) => setConfig({...config, maxTempC: Number(e.target.value)})} /></div>
                        </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveConfig} className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar Cambios</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        
        {/* 1. Panel de Control */}
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-lg">Acciones Rápidas</h3>
                    <p className="text-sm text-muted-foreground">Controla tu dispositivo manualmente</p>
                </div>
                <Button size="lg" onClick={handleWatering} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105">
                    <Droplet className="h-5 w-5 mr-2 animate-bounce" />
                    Activar Riego (5s)
                </Button>
            </CardContent>
        </Card>

        {/* 2. Grid de KPIs (6 Tarjetas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ESI */}
            <Card>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest">Salud General (ESI)</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <span className={`text-4xl font-bold ${getHealthColor(safeKpi.healthIndex)}`}>{safeKpi.healthIndex}%</span>
                        <span className="text-sm font-medium text-muted-foreground mb-1">{safeKpi.healthIndex > 80 ? "Excelente" : "Atención"}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full ${getHealthBgColor(safeKpi.healthIndex)}`} style={{ width: `${safeKpi.healthIndex}%` }} />
                    </div>
                </CardContent>
            </Card>

            {/* DQR */}
            <Card>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Shield className="h-3 w-3"/> Calidad Datos</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-blue-600">{safeKpi.dataQuality}%</span>
                        <span className="text-sm text-muted-foreground mb-1">Fiabilidad</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Lecturas válidas recibidas</div>
                </CardContent>
            </Card>

            {/* Temperatura */}
            <Card>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><ThermometerSun className="h-3 w-3"/> Temperatura</CardDescription></CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-slate-800">{safeKpi.currentTemp}°C</div>
                    <div className="text-xs text-muted-foreground mt-2">Ambiente</div>
                </CardContent>
            </Card>

            {/* Humedad Suelo */}
            <Card className={safeKpi.currentSoil < config.minSoilHumidity ? "border-red-400 bg-red-50" : ""}>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Waves className="h-3 w-3"/> Suelo</CardDescription></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <span className={`text-4xl font-bold ${safeKpi.currentSoil < config.minSoilHumidity ? "text-red-600" : "text-teal-600"}`}>{safeKpi.currentSoil}%</span>
                        {safeKpi.currentSoil < config.minSoilHumidity && <Badge variant="destructive" className="animate-pulse">SECO</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Meta: {config.minSoilHumidity}% - {config.maxSoilHumidity}%</div>
                </CardContent>
            </Card>

            {/* Humedad Aire (Calculada de history o default) */}
            <Card>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><CloudRain className="h-3 w-3"/> Humedad Aire</CardDescription></CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-blue-400">{currentAmbientHum}%</div>
                    <div className="text-xs text-muted-foreground mt-2">Relativa</div>
                </CardContent>
            </Card>

            {/* Luz */}
            <Card>
                <CardHeader className="pb-2"><CardDescription className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Sun className="h-3 w-3"/> Luz</CardDescription></CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-orange-500">{safeKpi.currentLight} <span className="text-lg text-muted-foreground font-normal">lx</span></div>
                    <div className="text-xs text-muted-foreground mt-2">{getLightDescription(safeKpi.currentLight)}</div>
                </CardContent>
            </Card>
        </div>

        {/* 3. Gráficas con Pestañas (Tabs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Gráfica de Líneas */}
            <Card className="lg:col-span-2 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg">Historial Ambiental</CardTitle>
                        <CardDescription>Tendencias en tiempo real</CardDescription>
                    </div>
                    <Select value={timePeriod} onValueChange={setTimePeriod}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">24 Horas</SelectItem>
                            <SelectItem value="7d">7 Días</SelectItem>
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
                                    <XAxis dataKey="time" fontSize={10} tickMargin={10} stroke="#888" />
                                    <YAxis fontSize={10} stroke="#888" domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="ambientHum" name="Humedad Aire (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        <TabsContent value="growth" className="flex-1 h-full min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="time" fontSize={10} tickMargin={10} stroke="#888" />
                                    <YAxis yAxisId="left" fontSize={10} stroke="#14b8a6" domain={[0, 100]} />
                                    <YAxis yAxisId="right" orientation="right" fontSize={10} stroke="#f97316" />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="soilHum" name="Humedad Suelo (%)" stroke="#14b8a6" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="light" name="Luz (Lux)" stroke="#f97316" strokeWidth={2} dot={false} />
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
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
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
                    <div className="w-full mt-4 space-y-2 px-4">
                        {clusteringData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="capitalize">{item.name.replace("_", " ")}</span>
                                </div>
                                <span className="font-bold">{item.value} lecturas</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* 4. Metadatos Técnicos */}
        <Accordion type="single" collapsible className="bg-white rounded-lg border px-4">
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-3">
                    Ver Detalles Técnicos del Dispositivo
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 text-xs font-mono">
                        <div>
                            <span className="block text-gray-400">Internal ID</span>
                            <span>{deviceInfo?.id || "N/A"}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400">MQTT Topic</span>
                            <span>{deviceInfo?.topic || "N/A"}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400">Owner</span>
                            <span>{deviceInfo?.ownerId || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {deviceInfo?.isActive ? <CheckCircle className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-red-500"/>}
                            <span>{deviceInfo?.isActive ? "Conectado" : "Desconectado"}</span>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

      </main>
    </div>
  )
}