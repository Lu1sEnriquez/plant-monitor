"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Plus, Droplet, AlertTriangle, LogOut, Loader2, Signal } from "lucide-react"
import Link from "next/link"
import { apiService } from "@/services/apiService"
import { PlantDevice } from "@/types"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  
  // Estado real de plantas
  const [plants, setPlants] = useState<PlantDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estado del Modal de Creación
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPlantId, setNewPlantId] = useState("")
  const [newPlantName, setNewPlantName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // 1. Cargar Usuario y Plantas
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
      return
    }
    setUser(storedUser)
    fetchPlants()
  }, [router])

  const fetchPlants = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getDevices()
      setPlants(data)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar tus plantas")
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Crear Nueva Planta
 const handleAddPlant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlantId || !newPlantName) return

    // RECUPERAR EL ID DEL USUARIO
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
        toast.error("Error: No se encontró el ID de usuario. Por favor, inicia sesión de nuevo.");
        return;
    }

    setIsCreating(true)
    try {
      // PASAR EL userId COMO TERCER PARÁMETRO
      await apiService.createDevice(newPlantId, newPlantName, userId)
      
      toast.success("¡Planta registrada exitosamente!")
      
      // Limpiar y recargar
      setNewPlantId("")
      setNewPlantName("")
      setIsDialogOpen(false)
      fetchPlants() 
    } catch (error) {
      console.error(error)
      // Mostrar el mensaje real del backend si existe
      const message = error instanceof Error ? error.message : "Error al registrar la planta."
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear() // Borrar todo (user, apiUser, apiPass)
    router.push("/login")
  }

  // Helpers visuales
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-500 hover:bg-gray-600"
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-blue-50">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2">
              <Leaf className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Plant Monitor</h1>
              <p className="text-xs text-muted-foreground">Hola, {user}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-balance">Mis Plantas</h2>
            <p className="text-muted-foreground mt-1">Gestiona y monitorea tu colección</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-5 w-5" />
                Agregar Planta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nueva Planta</DialogTitle>
                <DialogDescription>Ingresa el ID único de tu dispositivo ESP32</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPlant} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="plantId">ID del Dispositivo (Ej. Planta123)</Label>
                  <Input
                    id="plantId"
                    placeholder="Planta123"
                    value={newPlantId}
                    onChange={(e) => setNewPlantId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plantName">Nombre Visible (Ej. Helecho Sala)</Label>
                  <Input
                    id="plantName"
                    placeholder="Mi Planta Favorita"
                    value={newPlantName}
                    onChange={(e) => setNewPlantName(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
                    </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {isLoading && (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        )}

        {/* Empty State */}
        {!isLoading && plants.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No tienes plantas registradas</h3>
                <p className="text-muted-foreground">Agrega tu primer dispositivo para comenzar.</p>
            </div>
        )}

        {/* Plants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <Link key={plant.id} href={`/plant/${plant.plantId}`}>
              <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer h-full border-t-4 border-t-emerald-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-full bg-emerald-50 p-3">
                      <Leaf className="h-8 w-8 text-emerald-600" />
                    </div>
                    <Badge className={getStatusColor(plant.isActive)}>
                      <span className="flex items-center gap-1">
                        <Signal className="h-3 w-3" />
                        {plant.isActive ? "Conectada" : "Desconectada"}
                      </span>
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-xl">{plant.name}</CardTitle>
                  <CardDescription className="font-mono text-xs bg-muted px-2 py-1 rounded w-fit">
                    ID: {plant.plantId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Última conexión:</span>
                        <span>
                            {plant.lastDataReceived 
                                ? new Date(plant.lastDataReceived).toLocaleDateString() 
                                : "Nunca"}
                        </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}