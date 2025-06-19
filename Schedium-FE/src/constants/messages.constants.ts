export const MESSAGES = {
  // Success messages
  SUCCESS: {
    LOGIN: 'Inicio de sesión exitoso',
    LOGOUT: 'Sesión cerrada correctamente',
    SAVE: 'Cambios guardados exitosamente',
    CREATE: 'Registro creado exitosamente',
    UPDATE: 'Registro actualizado exitosamente',
    DELETE: 'Registro eliminado exitosamente',
  },
  
  // Error messages
  ERROR: {
    GENERIC: 'Ha ocurrido un error. Por favor, intente nuevamente.',
    NETWORK: 'Error de conexión. Verifique su conexión a internet.',
    UNAUTHORIZED: 'No tiene permisos para realizar esta acción.',
    SESSION_EXPIRED: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
    VALIDATION: 'Por favor, corrija los errores en el formulario.',
    SERVER: 'Error del servidor. Por favor, contacte al administrador.',
  },
  
  // Validation messages
  VALIDATION: {
    REQUIRED: 'Este campo es requerido',
    EMAIL: 'Ingrese un correo electrónico válido',
    MIN_LENGTH: (min: number): string => `Mínimo ${min} caracteres`,
    MAX_LENGTH: (max: number): string => `Máximo ${max} caracteres`,
    PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
    INVALID_FORMAT: 'Formato inválido',
  },
  
  // Confirmation messages
  CONFIRM: {
    DELETE: '¿Está seguro que desea eliminar este registro?',
    LOGOUT: '¿Está seguro que desea cerrar sesión?',
    UNSAVED_CHANGES: 'Tiene cambios sin guardar. ¿Desea continuar?',
  },
} as const