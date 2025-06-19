import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProgrammingPage } from '@/pages/ProgrammingPage'
import { ConsultasPage } from '@/pages/ConsultasPage'
import { InformesPage } from '@/pages/InformesPage'
import { AcademicPage } from '@/pages/academic/AcademicPage'
import { HRPage } from '@/pages/hr/HRPage'
import { InfrastructurePage } from '@/pages/infrastructure/InfrastructurePage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { ROUTES } from '@/constants/routes.constants'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.DASHBOARD} element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path={ROUTES.PROGRAMMING} element={<AuthGuard><ProgrammingPage /></AuthGuard>} />
        <Route path={ROUTES.CONSULTAS} element={<AuthGuard><ConsultasPage /></AuthGuard>} />
        <Route path={ROUTES.INFORMES} element={<AuthGuard><InformesPage /></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.MAIN} element={<AuthGuard><AcademicPage /></AuthGuard>} />
        <Route path={ROUTES.HR.MAIN} element={<AuthGuard><HRPage /></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.MAIN} element={<AuthGuard><InfrastructurePage /></AuthGuard>} />
        <Route path={ROUTES.ADMIN.MAIN} element={<AuthGuard><AdminPage /></AuthGuard>} />
        <Route path={ROUTES.PROFILE} element={<AuthGuard><ProfilePage /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}