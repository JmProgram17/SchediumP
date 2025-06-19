/**
 * Home Page - Landing page for Schedium
 */

import React from 'react'

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Schedium
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Sistema de Gestión de Horarios Académicos SENA
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Plataforma completa para la gestión, optimización y visualización 
              de horarios académicos con tecnología de vanguardia.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestión de Horarios</h3>
              <p className="text-gray-600">
                Crea, edita y optimiza horarios académicos con drag & drop
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestión de Cursos</h3>
              <p className="text-gray-600">
                Administra materias, prerrequisitos y programas académicos
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestión de Instructores</h3>
              <p className="text-gray-600">
                Control de carga académica y especialidades docentes
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestión de Aulas</h3>
              <p className="text-gray-600">
                Optimización de espacios y recursos físicos disponibles
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Reportes y Analytics</h3>
              <p className="text-gray-600">
                Análisis detallado y reportes personalizables
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiplataforma</h3>
              <p className="text-gray-600">
                Acceso desde cualquier dispositivo con PWA
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Acceder al Sistema
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Ver Demo
            </a>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold mb-6">Estado del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">✅ Operativo</div>
                <p className="text-gray-600">Todos los servicios funcionando</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">v1.0.0</div>
                <p className="text-gray-600">Versión actual del sistema</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">🚀 PWA</div>
                <p className="text-gray-600">Progressive Web App habilitada</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-500">
              © 2024 Schedium - Sistema de Gestión de Horarios Académicos SENA
            </p>
            <div className="mt-4 flex justify-center space-x-6">
              <span className="text-sm text-gray-400">🌐 Multiidioma</span>
              <span className="text-sm text-gray-400">📱 Responsive</span>
              <span className="text-sm text-gray-400">A11Y Accesible</span>
              <span className="text-sm text-gray-400">⚡ Rápido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home