import { Card } from '@/design-system/components'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Configuración general del sistema</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Configuración está en desarrollo
        </p>
      </Card>
    </div>
  )
}