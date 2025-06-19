import { Card } from '@/design-system/components'

export function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Usuarios está en desarrollo
        </p>
      </Card>
    </div>
  )
}