import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { SetPasswordPage } from '@/pages/auth/SetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import ProgrammingPage from '@/pages/ProgrammingPage'
import ConsultasPage from '@/pages/ConsultasPage'
import InformesPage from '@/pages/InformesPage'
import { AcademicPage } from '@/pages/academic/AcademicPage'
import ProgramsPage from '@/pages/academic/ProgramsPage'
import { CoursesPage } from '@/pages/academic/CoursesPage'
import GroupsPage from '@/pages/academic/GroupsPage'
import { EnrollmentsPage } from '@/pages/academic/EnrollmentsPage'
import { LevelsPage } from '@/pages/academic/LevelsPage'
import { StudentsPage } from '@/pages/StudentsPage'
import { SchedulesPage } from '@/pages/scheduling/SchedulesPage'
import { ConflictsPage } from '@/pages/scheduling/ConflictsPage'
import { CalendarPage } from '@/pages/scheduling/CalendarPage'
import HRPage from '@/pages/hr/HRPage'
import { InstructorsPage } from '@/pages/hr/InstructorsPage'
import { DepartmentsPage } from '@/pages/hr/DepartmentsPage'
import { PositionsPage } from '@/pages/hr/PositionsPage'
import { CoordinationsPage } from '@/pages/hr/CoordinationsPage'
import InfrastructurePage from '@/pages/infrastructure/InfrastructurePage'
import { CampusPage } from '@/pages/infrastructure/CampusPage'
import { BuildingsPage } from '@/pages/infrastructure/BuildingsPage'
import { ClassroomsPage } from '@/pages/infrastructure/ClassroomsPage'
import EnvironmentsPage from '@/pages/infrastructure/EnvironmentsPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { UsersPage } from '@/pages/hr/UsersPage'
import { RolesPage } from '@/pages/admin/RolesPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { MainLayout } from '@/layouts/MainLayout'
import { ROUTES } from '@/constants/routes.constants'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path={ROUTES.DASHBOARD} element={<AuthGuard><MainLayout><DashboardPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.PROGRAMMING} element={<AuthGuard><MainLayout><ProgrammingPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.CONSULTAS} element={<AuthGuard><MainLayout><ConsultasPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFORMES} element={<AuthGuard><MainLayout><InformesPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.MAIN} element={<AuthGuard><MainLayout><AcademicPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.PROGRAMS} element={<AuthGuard><MainLayout><ProgramsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.COURSES} element={<AuthGuard><MainLayout><CoursesPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.GROUPS} element={<AuthGuard><MainLayout><GroupsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.ENROLLMENTS} element={<AuthGuard><MainLayout><EnrollmentsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.LEVELS} element={<AuthGuard><MainLayout><LevelsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ACADEMIC.STUDENTS} element={<AuthGuard><MainLayout><StudentsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.HR.MAIN} element={<AuthGuard><MainLayout><HRPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.HR.INSTRUCTORS} element={<AuthGuard><MainLayout><InstructorsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.HR.DEPARTMENTS} element={<AuthGuard><MainLayout><DepartmentsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.HR.POSITIONS} element={<AuthGuard><MainLayout><PositionsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.HR.COORDINATIONS} element={<AuthGuard><MainLayout><CoordinationsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.CAMPUS} element={<AuthGuard><MainLayout><CampusPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.ENVIRONMENTS} element={<AuthGuard><MainLayout><EnvironmentsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.BUILDINGS} element={<AuthGuard><MainLayout><BuildingsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.CLASSROOMS} element={<AuthGuard><MainLayout><ClassroomsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.INFRASTRUCTURE.MAIN} element={<AuthGuard><MainLayout><InfrastructurePage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ADMIN.MAIN} element={<AuthGuard><MainLayout><AdminPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ADMIN.USERS} element={<AuthGuard><MainLayout><UsersPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ADMIN.ROLES} element={<AuthGuard><MainLayout><RolesPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.ADMIN.SETTINGS} element={<AuthGuard><MainLayout><SettingsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.SCHEDULING.SCHEDULES} element={<AuthGuard><MainLayout><SchedulesPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.SCHEDULING.CONFLICTS} element={<AuthGuard><MainLayout><ConflictsPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.SCHEDULING.CALENDAR} element={<AuthGuard><MainLayout><CalendarPage /></MainLayout></AuthGuard>} />
        <Route path={ROUTES.PROFILE} element={<AuthGuard><MainLayout><ProfilePage /></MainLayout></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}