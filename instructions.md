# Plataforma CLUP — Centro de Lenguas UP

Quiero que construyas una plataforma web completa para el **CLUP (Centro de Lenguas de la Universidad Panamericana)**.

Antes de escribir código, **inspecciona todo el repositorio actual**, especialmente el archivo:

`/design.md`

Este archivo contiene el sistema de diseño que debes utilizar. **No inventes un diseño visual diferente ni sustituyas el design system.** Analiza sus colores, tipografías, espaciados, componentes, estilos, layouts, botones, formularios, tablas, cards, estados, etc., y utiliza ese sistema de manera consistente en toda la aplicación.

Si ya existen archivos, componentes o configuraciones útiles en el repositorio, reutilízalos cuando tenga sentido.

---

# 1. Stack tecnológico obligatorio

La aplicación debe construirse utilizando:

- **Next.js** con App Router
- **TypeScript**
- Backend utilizando las capacidades server-side de Next.js
- **PostgreSQL** como base de datos
- ORM recomendado: **Prisma**
- **Clerk** para autenticación
- Login mediante **Google**
- **Mailgun** para envío de correos
- Tailwind CSS si es compatible con el `design.md`
- Arquitectura preparada para producción

No hagas un backend separado si no es necesario. El backend debe vivir dentro del proyecto Next.js mediante Route Handlers / Server Actions según corresponda.

---

# 2. Concepto general

La plataforma tendrá dos tipos principales de usuarios:

1. **Alumno**
2. **Administrador**

La aplicación tendrá una parte pública que **NO requiere iniciar sesión** y una parte privada para alumnos y administradores.

---

# 3. Parte pública — Sin login

Cualquier persona debe poder entrar a la plataforma sin autenticarse.

La página pública debe permitir consultar información sobre los próximos exámenes disponibles del CLUP.

Principalmente:

- TOEIC
- TOEFL

Debe mostrar:

### Próximos exámenes

Cada examen debe mostrar información como:

- Tipo de examen
- Nombre
- Term/ciclo
- Fecha del examen
- Fecha de inicio de inscripción
- Fecha límite de inscripción
- Estado
- Información relevante
- Instrucciones para inscribirse

Por ejemplo:

**TOEIC — Otoño 2026**
- Examen: 30 de agosto de 2026
- Inscripciones: 15 al 21 de agosto de 2026

La información debe venir de PostgreSQL y ser administrable desde el dashboard.

---

# 4. Portal de pagos

En la parte pública debe existir un botón para ir al portal de pagos.

La URL del portal de pagos **NO debe estar hardcodeada**.

El administrador debe poder configurar/modificar esta URL desde el dashboard.

Ejemplo:

`Pagar examen`

Al hacer click debe abrir el portal configurado.

---

# 5. FAQ

La página pública debe mostrar preguntas frecuentes.

Ejemplo:

- ¿Qué necesito para inscribirme?
- ¿Cuándo puedo inscribirme?
- ¿Qué documentos necesito?
- ¿Dónde realizo el pago?
- ¿Cuándo recibiré mis resultados?

Los FAQs deben ser completamente administrables desde el dashboard:

- Crear
- Editar
- Eliminar
- Activar/desactivar
- Ordenar

---

# 6. Instrucciones

También debe existir una sección pública de instrucciones.

Las instrucciones deben ser administrables desde el dashboard.

El administrador debe poder:

- Crear instrucciones
- Editarlas
- Eliminarlas
- Activarlas/desactivarlas
- Ordenarlas

---

# 7. Autenticación

Para poder realizar una inscripción, el alumno debe iniciar sesión.

Utiliza:

**Clerk + Google**

No implementes un sistema de autenticación propio.

Al iniciar sesión necesitamos obtener desde Clerk:

- Nombre
- Email
- Identificador único del usuario

El email será especialmente importante porque queremos identificar al alumno mediante su correo institucional.

El usuario no debe tener que escribir manualmente su nombre ni correo si Clerk ya los proporciona.

---

# 8. Flujo del alumno

El flujo esperado es:

### Usuario entra a la plataforma

Puede consultar:

- Próximos exámenes
- Fechas
- Instrucciones
- FAQs
- Portal de pagos

Sin login.

---

### Usuario selecciona un examen

Puede ver el detalle:

- Tipo de examen
- Term
- Fecha
- Periodo de inscripción
- Instrucciones
- Información de pago
- Estado de inscripción

Si la inscripción está abierta debe aparecer:

**Inscribirme**

Si todavía no inicia:

**Inscripciones próximamente**

Si ya terminó:

**Inscripciones cerradas**

---

# 9. Registro a examen

Para registrarse debe iniciar sesión con Clerk.

Después debe aparecer un formulario de inscripción.

Datos obtenidos automáticamente desde Clerk:

- Nombre
- Email
- Clerk User ID

El usuario debe subir:

### Documentos obligatorios

1. Comprobante de pago
2. Credencial de la Universidad — frente
3. INE — frente
4. INE — vuelta

Los documentos deben almacenarse de forma segura.

No guardes archivos directamente dentro de PostgreSQL.

La base de datos debe guardar únicamente la referencia necesaria al archivo.

Considera una arquitectura de storage que pueda utilizarse en producción y deja claramente documentada la solución.

---

# 10. Validaciones de inscripción

El alumno **SOLO puede registrarse si la fecha actual está dentro del periodo de inscripción configurado por el administrador**.

Cada fecha de examen debe tener:

- `registrationStartDate`
- `registrationEndDate`
- `examDate`

Validar esto tanto en frontend como en backend.

**La validación importante debe existir en backend**, para evitar que alguien manipule el frontend.

También evitar:

- Inscripciones duplicadas al mismo examen
- Archivos inválidos
- Archivos demasiado grandes
- Tipos MIME no permitidos
- Formularios incompletos

---

# 11. Estados de inscripción

Cada inscripción debe tener un estado.

Como mínimo:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

Cuando el alumno termina el registro:

**PENDING**

Cuando un administrador aprueba:

**APPROVED**

Cuando se rechaza:

**REJECTED**

El alumno debe poder ver claramente el estado.

---

# 12. Dashboard del alumno

El alumno debe tener un dashboard donde pueda ver sus exámenes.

Debe poder tener múltiples inscripciones.

Ejemplo:

### Mis exámenes

**TOEIC — Otoño 2026**
- Fecha: 30 agosto
- Estado: Inscrito
- Resultado: Pendiente

**TOEFL — Primavera 2027**
- Fecha: 15 enero
- Estado: Pendiente de aprobación
- Resultado: Pendiente

Cada examen debe poder abrirse para ver su detalle.

---

# 13. Resultado del examen

Después de que el alumno presenta el examen, el administrador puede cargar su resultado.

El alumno debe poder ver:

- Resultado
- Puntaje
- Si aprobó o no
- Fecha del examen

Por ejemplo:

**Resultado**
- TOEIC
- Puntaje: 785
- Resultado: APROBADO

El administrador debe definir el puntaje necesario para aprobar.

Por ejemplo:

`passingScore = 700`

La aplicación debe calcular automáticamente:

`score >= passingScore → APROBADO`

`score < passingScore → NO APROBADO`

El `passingScore` debe pertenecer al examen/fecha correspondiente y ser editable desde administración.

---

# 14. Notificaciones por correo

Utilizar **Mailgun**.

Crear una arquitectura de emails centralizada y reutilizable.

Enviar email cuando:

### Nueva inscripción

Cuando el alumno termina de registrarse:

> Tu inscripción fue recibida y está pendiente de aprobación.

---

### Inscripción aprobada

Cuando un administrador aprueba:

> Tu inscripción al examen ha sido aprobada.

Incluir:

- Examen
- Fecha
- Información relevante

---

### Resultado publicado

Cuando el administrador publica el resultado:

> Tu resultado ya está disponible.

Incluir:

- Examen
- Puntaje
- Aprobado / No aprobado

---

### Recordatorio

Enviar automáticamente un email **1 día antes del examen**.

El email debe indicar:

- Examen
- Fecha
- Información importante
- Instrucciones relevantes

Diseña este sistema de forma que posteriormente podamos cambiar el proveedor de email si fuera necesario.

---

# 15. Modelo de exámenes

La estructura debe permitir múltiples ciclos/terms.

Ejemplo:

## Otoño 2026

Puede contener:

- TOEIC — 30 agosto
- TOEIC — 15 septiembre
- TOEFL — 20 septiembre
- TOEIC — 10 octubre

Y posteriormente:

## Primavera 2027

Con sus propias fechas.

Por lo tanto:

**Term**
→ múltiples **Exam Dates**

---

# 16. Estructura sugerida

Conceptualmente:

Term

- id
- name
- year
- description
- active
- createdAt
- updatedAt

Exam

- id
- type
- name
- description
- passingScore
- active

ExamDate

- id
- termId
- examId
- registrationStartDate
- registrationEndDate
- examDate
- capacity opcional
- instructions
- active

Esto es una propuesta inicial.

Analiza si la estructura puede mejorarse antes de implementarla.

---

# 17. Dashboard administrativo

Debe existir una sección `/admin`.

Solo usuarios autorizados como administradores pueden acceder.

El dashboard debe tener navegación para:

- Overview
- Terms
- Exámenes
- Fechas de examen
- Inscripciones
- Resultados
- FAQs
- Instrucciones
- Configuración
- Administradores

---

# 18. Gestión de Terms

Admin puede:

- Crear term
- Editar term
- Activar/desactivar
- Eliminar cuando sea seguro hacerlo

Ejemplo:

**Otoño 2026**

Dentro:

- TOEIC — 30 agosto
- TOEIC — 15 septiembre
- TOEFL — 20 septiembre

---

# 19. Gestión de fechas de examen

Admin puede crear una fecha.

Debe poder definir:

- Tipo de examen
- Nombre
- Term
- Fecha de examen
- Inicio de inscripción
- Fin de inscripción
- Passing score
- Instrucciones
- Estado

Debe haber validaciones para evitar inconsistencias.

Por ejemplo:

`registrationStartDate < registrationEndDate < examDate`

---

# 20. Gestión de inscripciones

El administrador debe poder ver las inscripciones.

Debe poder filtrar por:

- Term
- Examen
- Fecha de examen
- Estado
- Alumno

Mostrar una tabla con información como:

- Alumno
- ID
- Email
- Examen
- Term
- Fecha
- Estado
- Resultado

---

# 21. Detalle de inscripción

Al abrir una inscripción, el administrador debe poder ver:

### Información del alumno

- Nombre
- Email
- ID
- Clerk User ID

### Información del examen

- Examen
- Term
- Fecha

### Documentos

- Comprobante de pago
- Credencial frente
- INE frente
- INE vuelta

Debe poder visualizar los documentos de forma segura.

También debe poder:

- Aprobar
- Rechazar

Si rechaza, idealmente permitir registrar un motivo de rechazo.

---

# 22. Resultados individuales

El administrador debe poder entrar a una inscripción y capturar:

- Puntaje
- Resultado

Preferentemente el resultado de aprobado/no aprobado debe calcularse automáticamente según el `passingScore`.

Debe existir una opción:

**Publicar resultado**

para que el alumno pueda verlo y se dispare el correo de Mailgun.

---

# 23. Carga masiva de resultados

Debe existir una funcionalidad para cargar resultados masivamente.

El administrador podrá seleccionar:

- Term
- Examen
- Fecha

Y subir un archivo CSV.

Ejemplo:

```csv
student_id,score
0272150,785
0277068,650
0279209,720
```

La aplicación debe:

1. Leer el CSV
2. Validar las columnas
3. Buscar al alumno
4. Buscar su inscripción
5. Validar que pertenece al term/examen/fecha seleccionados
6. Registrar el score
7. Calcular aprobado/no aprobado
8. Mostrar errores de filas inválidas
9. Mostrar resumen de importación
10. Permitir confirmar la importación

No sobrescribir datos existentes silenciosamente.

Si existen resultados previos, mostrar advertencia.

---

# 24. Exportación CSV

El administrador debe poder descargar información en CSV.

Como mínimo:

### Exportar inscritos

Con:

- ID
- Nombre
- Email
- Examen
- Term
- Fecha
- Estado

### Exportar resultados

Con:

- ID
- Nombre
- Email
- Examen
- Term
- Fecha
- Puntaje
- Resultado

Debe poder filtrar antes de exportar.

---

# 25. Administración de administradores

Debe existir una sección para gestionar administradores.

Un administrador autorizado debe poder:

- Agregar administrador
- Quitar administrador
- Ver administradores actuales

La autorización debe estar basada en roles/permisos reales del backend, no solamente ocultando elementos en el frontend.

Utiliza Clerk para la identidad y establece una estrategia clara para roles administrativos.

Debe existir al menos:

- `student`
- `admin`

Si consideras que conviene implementar posteriormente `super_admin`, deja la arquitectura preparada.

---

# 26. Seguridad

Esto es importante.

Implementa:

- Protección de rutas
- Protección de APIs
- Autorización server-side
- Validación de inputs
- Validación de archivos
- Límites de tamaño
- Validación MIME
- Prevención de acceso a documentos de otros alumnos
- Prevención de modificación de inscripciones ajenas
- Protección contra usuarios no autorizados
- No confiar en datos enviados desde frontend
- Variables sensibles únicamente en `.env`
- No exponer secretos
- Sanitización de datos cuando sea necesario

Los documentos personales son información sensible, por lo que su acceso debe estar estrictamente controlado.

---

# 27. UX

La plataforma debe sentirse como un producto real de la Universidad Panamericana.

Debe ser:

- Moderna
- Limpia
- Institucional
- Responsive
- Accesible
- Fácil de utilizar

Pero **el diseño visual debe derivarse del `design.md` existente**.

No inventes colores, tipografías o componentes si el design system ya los define.

Crear estados para:

- Loading
- Empty
- Error
- Success
- Pending
- Approved
- Rejected
- Closed
- Upcoming

Utilizar skeletons cuando tenga sentido.

Mostrar confirmaciones antes de acciones destructivas.

---

# 28. Arquitectura

Quiero una arquitectura limpia y mantenible.

Separar claramente:

- UI
- Server components
- Client components
- Database
- Services
- Authentication
- Email
- File storage
- Validation
- Business logic

No poner toda la lógica dentro de componentes React.

Crear servicios reutilizables.

Por ejemplo conceptualmente:

```text
src/
  app/
  components/
  features/
  lib/
    auth/
    db/
    mail/
    storage/
    validations/
  services/
  types/
```

Puedes modificar esta estructura si existe una mejor arquitectura para Next.js.

---

# 29. Base de datos

Diseña primero el modelo de PostgreSQL.

Como mínimo deben contemplarse entidades para:

- Users/Profile
- Terms
- Exams
- ExamDates
- Registrations
- Documents
- Results
- FAQs
- Instructions
- Settings
- Admins/Roles

Define correctamente:

- Primary keys
- Foreign keys
- Unique constraints
- Indexes
- Enums
- Timestamps
- Relaciones

Por ejemplo, debe ser imposible tener dos registros del mismo alumno para la misma fecha de examen.

---

# 30. Auditoría

Para acciones administrativas importantes, considera un sistema de auditoría.

Por ejemplo:

- Quién aprobó una inscripción
- Quién rechazó una inscripción
- Quién publicó un resultado
- Quién modificó una fecha
- Quién cambió un passing score

Si implementas audit logs, deben guardar:

- Usuario
- Acción
- Entidad
- ID de entidad
- Fecha
- Información relevante

---

# 31. Configuración

Crear configuración administrable para elementos como:

- Portal de pagos
- Información general
- Contacto
- Emails institucionales
- Otros valores globales

No hardcodear valores que razonablemente podrían cambiar desde administración.

---

# 32. Seed / datos iniciales

Crear seed de base de datos para desarrollo.

Incluir ejemplos:

### Term

Otoño 2026

### Exámenes

TOEIC

TOEFL

### Fechas

Algunas fechas de ejemplo con diferentes estados.

También incluir FAQs e instrucciones de ejemplo.

---

# 33. Variables de entorno

Crear `.env.example`.

Debe contemplar como mínimo:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM=

FILE_STORAGE_...
```

No incluir secretos reales.

---

# 34. Emails

Crear templates reutilizables para Mailgun.

Idealmente:

```text
registration-created
registration-approved
result-published
exam-reminder
```

Mantener los templates separados de la lógica de negocio.

---

# 35. Recordatorios automáticos

El correo de 1 día antes del examen requiere un mecanismo de ejecución programada.

Diseña la solución de manera que pueda ejecutarse mediante un cron job / scheduler compatible con el deployment.

Debe:

1. Buscar exámenes que ocurran mañana
2. Buscar alumnos aprobados inscritos
3. Evitar enviar dos veces el mismo reminder
4. Enviar email
5. Registrar que fue enviado

La operación debe ser idempotente.

---

# 36. Testing

Implementa pruebas para las partes críticas.

Como mínimo:

- Validación de fechas de inscripción
- Inscripción fuera de rango
- Inscripción dentro de rango
- Inscripción duplicada
- Cálculo aprobado/no aprobado
- Autorización de admin
- Acceso a documentos
- Importación CSV
- Exportación CSV

---

# 37. Manejo de errores

No mostrar errores técnicos al usuario.

Crear mensajes claros.

Ejemplo:

En lugar de:

`PrismaClientKnownRequestError...`

mostrar:

> No pudimos completar tu inscripción. Intenta nuevamente.

Los errores deben quedar registrados de forma útil para debugging.

---

# 38. README

Crear un README completo que explique:

- Qué es el proyecto
- Stack
- Arquitectura
- Instalación
- Variables de entorno
- Configuración de PostgreSQL
- Configuración de Clerk
- Configuración de Google Login
- Configuración de Mailgun
- Configuración del storage
- Migraciones
- Seed
- Desarrollo local
- Build
- Deployment
- Cron de recordatorios

---

# 39. Forma de trabajar

IMPORTANTE:

**NO empieces simplemente generando archivos sin analizar el proyecto.**

Primero:

### Fase 1 — Análisis

Inspecciona:

- Estructura del repositorio
- `design.md`
- package.json
- Configuración existente
- Dependencias
- Componentes existentes
- Configuración de Next.js
- Configuración de Tailwind
- Cualquier otro archivo relevante

Después dame un resumen de:

1. Qué encontraste
2. Qué stack ya existe
3. Cómo está estructurado actualmente
4. Qué componentes del `design.md` vas a reutilizar
5. Qué arquitectura propones
6. Modelo de datos propuesto
7. Qué partes requieren configuración externa

**No necesito que me preguntes cosas que puedas resolver razonablemente por tu cuenta.**

Si existe una decisión realmente bloqueante, pregúntame antes de continuar.

---

### Fase 2 — Arquitectura

Antes de construir la UI completa:

- Definir schema Prisma
- Relaciones
- Roles
- Autenticación
- Autorización
- Storage
- Mailgun
- Servicios
- API/server actions

Verifica que la arquitectura soporte todos los flujos descritos anteriormente.

---

### Fase 3 — Backend

Implementar:

- Prisma
- PostgreSQL
- Migraciones
- Seed
- Auth
- Roles
- APIs / Server Actions
- Validaciones
- Servicios
- Storage
- Emails
- Importación CSV
- Exportación CSV

---

### Fase 4 — Frontend

Construir:

1. Landing pública
2. Exámenes
3. Detalle de examen
4. Login
5. Registro
6. Dashboard alumno
7. Detalle de inscripción
8. Resultados
9. Dashboard admin
10. Gestión de terms
11. Gestión de exámenes
12. Gestión de inscripciones
13. Gestión de resultados
14. Importación masiva
15. FAQs
16. Instrucciones
17. Configuración
18. Administradores

Todo utilizando el sistema definido en `design.md`.

---

### Fase 5 — Integraciones

Integrar:

- Clerk
- Google
- PostgreSQL
- Mailgun
- File storage

---

### Fase 6 — Testing

Probar todos los flujos críticos.

---

# 40. Principios importantes

- TypeScript estricto.
- Código limpio y mantenible.
- No duplicar lógica.
- No hardcodear información que debe ser administrable.
- No confiar en validaciones del frontend.
- Todas las operaciones críticas deben validarse en servidor.
- Seguridad primero para documentos personales.
- UI consistente con `design.md`.
- Responsive desde el inicio.
- Accesibilidad razonable.
- Componentes reutilizables.
- No crear una arquitectura innecesariamente compleja.
- No agregar funcionalidades que no sean necesarias.
- Si haces una decisión de arquitectura importante, documentarla.

---

# 41. Resultado esperado

Quiero terminar con una aplicación funcional donde:

### Alumno

Puede:

- Consultar exámenes sin login
- Ver fechas
- Ver instrucciones
- Ver FAQs
- Ir al portal de pagos
- Iniciar sesión con Google
- Registrarse a un examen
- Subir documentos
- Ver estado de inscripción
- Tener múltiples exámenes
- Ver sus fechas
- Ver resultados
- Ver puntaje
- Ver si aprobó
- Recibir emails

### Admin

Puede:

- Gestionar terms
- Gestionar exámenes
- Gestionar fechas
- Definir ventanas de inscripción
- Definir passing score
- Gestionar FAQs
- Gestionar instrucciones
- Configurar portal de pagos
- Ver inscritos
- Filtrar inscritos
- Revisar documentos
- Aprobar/rechazar
- Subir resultados individualmente
- Subir resultados masivamente
- Exportar CSV
- Gestionar administradores
- Consultar información administrativa

Construye la aplicación de forma que sea **realmente funcional end-to-end**, no solamente un prototipo visual.

Empieza por inspeccionar el repositorio y `design.md`.