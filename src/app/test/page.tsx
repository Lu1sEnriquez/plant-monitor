"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Wifi, WifiOff, Send, Trash2, Play, Square } from "lucide-react"

// WebSocket
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WebSocketData } from "@/types"

interface TestMessage {
  id: string
  timestamp: string
  type: "TELEMETRY" | "PUMP_EVENT" | "ALERT" | "MANUAL"
  plantId: string
  data: WebSocketData
}

export default function WebSocketTestPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [plantId, setPlantId] = useState("Planta123")
  const [autoSend, setAutoSend] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const autoSendRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // 🔴 CONEXIÓN WEBSOCKET SIMPLIFICADA
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        console.log('🔗 Conectando WebSocket...')
        
        // ⚠️ AJUSTA ESTA URL SEGÚN TU BACKEND
        const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'
        const socket = new SockJS(socketUrl)
        
        const client = new Client({
          webSocketFactory: () => socket,
          reconnectDelay: 5000,
          debug: (str) => {
            if (str.includes('ERROR') || str.includes('close')) {
              console.error('STOMP:', str)
            }
          },
        })

        client.onConnect = () => {
          console.log('✅ WebSocket CONECTADO')
          setIsConnected(true)
          toast.success("WebSocket conectado")
          
          // Suscribirse a todos los tópicos de plantas
          client.subscribe(`/topic/plant/${plantId}`, (message) => {
            try {
              const data = JSON.parse(message.body)
              console.log('📥 Mensaje recibido:', data)
              
              const newMessage: TestMessage = {
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                type: data.type,
                plantId: data.plantId,
                data: data.data
              }
              
              setMessages(prev => [newMessage, ...prev.slice(0, 49)])
            } catch (error) {
              console.error('❌ Error parseando mensaje:', error)
            }
          })

          // También suscribirse a tópico general para testing
          client.subscribe('/topic/general', (message) => {
            console.log('📥 Mensaje general:', message.body)
          })
        }

        client.onStompError = (frame) => {
          console.error('❌ Error STOMP:', frame)
          setIsConnected(false)
          toast.error("Error de conexión WebSocket")
        }

        client.onDisconnect = () => {
          console.log('🔴 WebSocket DESCONECTADO')
          setIsConnected(false)
        }

        client.activate()
        stompClientRef.current = client

      } catch (error) {
        console.error('❌ Error conectando WebSocket:', error)
        toast.error("No se pudo conectar al WebSocket")
      }
    }

    connectWebSocket()

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate()
      }
      if (autoSendRef.current) {
        clearInterval(autoSendRef.current)
      }
    }
  }, [plantId])

  // 🔴 ENVIAR MENSAJE DE PRUEBA
  const sendTestMessage = (type: "TELEMETRY" | "PUMP_EVENT" | "ALERT") => {
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      toast.error("WebSocket no conectado")
      return
    }

    const testData = generateTestData(type)
    
    try {
      stompClientRef.current.publish({
        destination: `/app/test/${plantId}`,
        body: JSON.stringify(testData)
      })
      
      console.log('📤 Mensaje enviado:', testData)
      toast.success(`Mensaje ${type} enviado`)
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error)
      toast.error("Error enviando mensaje")
    }
  }

  // 🔴 GENERAR DATOS DE PRUEBA
  const generateTestData = (type: "TELEMETRY" | "PUMP_EVENT" | "ALERT") => {
    const baseData = {
      plantId,
      timestamp: new Date().toISOString()
    }

    switch (type) {
      case "TELEMETRY":
        return {
          ...baseData,
          type: "TELEMETRY",
          data: {
            temp: Math.random() * 30 + 10, // 10-40°C
            ambientHum: Math.random() * 50 + 30, // 30-80%
            soilHum: Math.random() * 100, // 0-100%
            light: Math.random() * 10000, // 0-10000 lux
            pumpState: Math.random() > 0.5 ? "ON" : "OFF",
            alertLevel: Math.random() > 0.8 ? "CRITICA" : "INFO"
          }
        }

      case "PUMP_EVENT":
        return {
          ...baseData,
          type: "PUMP_EVENT", 
          data: {
            pumpState: Math.random() > 0.5 ? "ON" : "OFF",
            event: `PUMP_${Math.random() > 0.5 ? "ON" : "OFF"}`
          }
        }

      case "ALERT":
        const alertTypes = ["CRITICA", "ALERTA", "INFO"]
        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        
        return {
          ...baseData,
          type: "ALERT",
          data: {
            level: randomAlert,
            message: `Alerta de prueba: ${randomAlert}`,
            metric: randomAlert === "CRITICA" ? "SOIL_HUMIDITY" : "TEMPERATURE"
          }
        }

      default:
        return baseData
    }
  }

  // 🔴 ENVÍO AUTOMÁTICO
  const toggleAutoSend = () => {
    if (autoSend) {
      // Detener envío automático
      if (autoSendRef.current) {
        clearInterval(autoSendRef.current)
        autoSendRef.current = undefined
      }
      setAutoSend(false)
      toast.info("Envío automático detenido")
    } else {
      // Iniciar envío automático
      setAutoSend(true)
      autoSendRef.current = setInterval(() => {
        const types: ("TELEMETRY" | "PUMP_EVENT" | "ALERT")[] = ["TELEMETRY", "PUMP_EVENT", "ALERT"]
        const randomType = types[Math.floor(Math.random() * types.length)]
        sendTestMessage(randomType)
      }, 3000) // Cada 3 segundos
      
      toast.success("Envío automático iniciado")
    }
  }

  // 🔴 LIMPIAR MENSAJES
  const clearMessages = () => {
    setMessages([])
    toast.info("Mensajes limpiados")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              🔧 Panel de Prueba WebSocket
            </CardTitle>
            <CardDescription>
              Conecta y prueba tu servicio WebSocket en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Estado de conexión */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "CONECTADO" : "DESCONECTADO"}
                </Badge>
              </div>

              {/* Input Plant ID */}
              <div className="flex items-center gap-2">
                <Label htmlFor="plantId" className="text-sm font-medium">
                  Plant ID:
                </Label>
                <Input
                  id="plantId"
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-32 h-8 text-sm"
                  placeholder="Planta123"
                />
              </div>

              {/* Botones de control */}
              <div className="flex gap-2">
                <Button
                  onClick={toggleAutoSend}
                  variant={autoSend ? "destructive" : "default"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {autoSend ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {autoSend ? "Detener Auto" : "Auto Enviar"}
                </Button>

                <Button
                  onClick={clearMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Control */}
        <Card>
          <CardHeader>
            <CardTitle>🔨 Control de Pruebas</CardTitle>
            <CardDescription>
              Envía mensajes de prueba manualmente al WebSocket
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => sendTestMessage("TELEMETRY")}
                className="flex items-center gap-2 h-16 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!isConnected}
              >
                <Send className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold">Telemetría</div>
                  <div className="text-xs opacity-90">Datos de sensores</div>
                </div>
              </Button>

              <Button
                onClick={() => sendTestMessage("PUMP_EVENT")}
                className="flex items-center gap-2 h-16 bg-green-500 hover:bg-green-600 text-white"
                disabled={!isConnected}
              >
                <Send className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold">Evento Bomba</div>
                  <div className="text-xs opacity-90">ON/OFF de riego</div>
                </div>
              </Button>

              <Button
                onClick={() => sendTestMessage("ALERT")}
                className="flex items-center gap-2 h-16 bg-red-500 hover:bg-red-600 text-white"
                disabled={!isConnected}
              >
                <Send className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold">Alerta</div>
                  <div className="text-xs opacity-90">Notificaciones</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensajes en Tiempo Real */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>📨 Mensajes Recibidos</CardTitle>
            <CardDescription>
              {messages.length} mensajes recibidos en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-lg">📡 Esperando mensajes...</div>
                    <div className="text-sm mt-2">
                      Los mensajes aparecerán aquí cuando se reciban
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        message.type === 'ALERT'
                          ? 'bg-red-50 border-red-200'
                          : message.type === 'PUMP_EVENT'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                message.type === 'ALERT'
                                  ? 'destructive'
                                  : message.type === 'PUMP_EVENT'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {message.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {message.plantId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp}
                            </span>
                          </div>
                          <pre className="text-xs bg-white/50 p-2 rounded border">
                            {JSON.stringify(message.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Información de Debug */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">🐛 Información de Debug</CardTitle>
            <CardDescription className="text-amber-700">
              Información útil para solucionar problemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-amber-800">Estado Conexión:</div>
                <div className="font-mono text-xs bg-white/50 p-2 rounded mt-1">
                  {isConnected ? '✅ CONECTADO' : '❌ DESCONECTADO'}
                </div>
              </div>
              <div>
                <div className="font-semibold text-amber-800">URL WebSocket:</div>
                <div className="font-mono text-xs bg-white/50 p-2 rounded mt-1">
                  {process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}