# 🔧 Solución al Error del Service Worker

## ❌ Error que aparece:
```
Failed to load 'http://localhost:3000/@vite/client'. A ServiceWorker passed a promise to FetchEvent.respondWith() that resolved with non-Response value 'null'. sw.js:127:11
```

## ✅ Solución PASO A PASO:

### Paso 1: Limpiar Cache del Navegador
1. **Abrir DevTools** (F12 o Ctrl+Shift+I)
2. **Ir a Application tab**
3. **Storage → Clear All** 
4. **Marcar todas las opciones** y hacer clic en "Clear site data"

### Paso 2: Desregistrar Service Workers Manualmente
1. En DevTools, ir a **Application → Service Workers**
2. **Hacer clic en "Unregister"** en cada service worker que aparezca
3. **Ir a Application → Cache Storage**
4. **Eliminar todos los caches** (botón delete en cada uno)

### Paso 3: Usar la Herramienta de Limpieza Automática
1. **Abrir**: http://localhost:3000/clear-cache.html
2. **Hacer clic en "Limpieza Completa"**
3. **Esperar** a que termine (verás mensajes verdes)
4. **Cerrar** esa pestaña

### Paso 4: Recarga Forzada
1. **Cerrar TODAS las pestañas** de localhost:3000
2. **Abrir una nueva pestaña**
3. **Hacer Ctrl+Shift+R** (recarga forzada)
4. **Ir a**: http://localhost:3000/

### Paso 5: Si Persiste el Error
1. **Ir a**: chrome://settings/content/all
2. **Buscar**: localhost:3000
3. **Hacer clic en el ícono de basura** para eliminar todos los datos del sitio
4. **Reiniciar** el navegador completamente

## 🚀 Método Rápido (Línea de Comandos)

Si tienes acceso a Chrome desde línea de comandos:

```bash
# Cerrar Chrome
pkill chrome

# Limpiar datos específicos del sitio
rm -rf ~/.config/google-chrome/Default/Service\ Worker/
rm -rf ~/.config/google-chrome/Default/Cache/
rm -rf ~/.config/google-chrome/Default/Application\ Cache/

# Abrir Chrome limpio
google-chrome --disable-web-security --disable-features=VizDisplayCompositor
```

## 📱 Método Alternativo - Navegador Privado
1. **Abrir ventana privada/incógnito** (Ctrl+Shift+N)
2. **Ir a**: http://localhost:3000/
3. **Si funciona en privado**, el problema es cache del navegador normal

## 🔍 Verificar que Funcionó
Cuando esté solucionado, en la consola del navegador deberías ver:
```
✅ Starting SW cleanup...
✅ Found 0 service worker registrations  
✅ All caches cleared
✅ SW cleanup complete - development mode ready
```

## ⚠️ IMPORTANTE
- **NO** recargues con F5 normal, usa **Ctrl+Shift+R**
- **Cierra todas las pestañas** de localhost:3000 antes de intentar de nuevo
- **El service worker está DESHABILITADO** para desarrollo
- **Solo afecta al desarrollo**, no a producción

## 🎯 ¿Por qué pasa esto?
El navegador tenía cached un service worker anterior que interceptaba las peticiones de Vite. Al deshabilitarlo y limpiar el cache, el problema se resuelve.

---

## ✨ Una vez solucionado:
**🚀 Ve a http://localhost:3000/ y disfruta del frontend funcionando!**

Todas las páginas están implementadas y listas para usar:
- Dashboard, Login, Programación, Consultas, Informes
- Académico, RRHH, Infraestructura, Administración, Mi Perfil