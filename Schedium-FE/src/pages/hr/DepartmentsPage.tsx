import { Card } from '@/design-system/components'

export function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Departamentos</h1>
        <p className="text-muted-foreground">Gestión de departamentos</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Departamentos está en desarrollo
        </p>
      </Card>
    </div>
  )
}