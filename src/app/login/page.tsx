"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Leaf, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiService } from "@/services/apiService" 

export default function LoginPage() {
  const router = useRouter()
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // 1. Llamada al servicio: Ahora devuelve el objeto usuario { id, username, email... }
      const userData = await apiService.login({ username, password })

      // 2. Guardar credenciales para las futuras peticiones (Basic Auth)
      localStorage.setItem("apiUser", username)
      localStorage.setItem("apiPass", password)

      // 3. Guardar datos del usuario (CRUCIAL: userId para crear plantas)
      localStorage.setItem("user", userData.username)
      localStorage.setItem("userId", userData.id) // <--- ESTO ES LO QUE FALTABA
      
      if (userData.email) {
        localStorage.setItem("email", userData.email)
      }

      console.log("Login exitoso. ID guardado:", userData.id)

      // 4. Redirigir al Dashboard
      router.push("/dashboard")

    } catch (err) {
      console.error(err)
      setError("Usuario o contraseña incorrectos.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-emerald-500">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-emerald-100 p-4">
              <Leaf className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Bienvenido</CardTitle>
          <CardDescription className="text-pretty">
            Ingresa tus credenciales para monitorear tus plantas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Mensaje de Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                placeholder="ej. luis.admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-emerald-600 hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}