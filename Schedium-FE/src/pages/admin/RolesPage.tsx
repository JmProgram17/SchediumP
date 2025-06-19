import { Card } from '@/design-system/components'

export function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles</h1>
        <p className="text-muted-foreground">Gestión de roles y permisos</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Roles está en desarrollo
        </p>
      </Card>
    </div>
  )
}