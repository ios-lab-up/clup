# Design System — Dashboards (Admin / Teacher / Student)

Extraído fielmente del código actual (`assets/src/components`). No es una propuesta de rediseño: documenta tabs, colores y layout tal como existen hoy, incluyendo las inconsistencias entre los tres dashboards.

## Paleta de colores (`assets/tailwind.config.js`)

```js
colors: {
  brand: "#FD4F00",   // definido, no usado en los dashboards

  wine: {
    50:  '#fdf2f4',
    100: '#fce7eb',
    200: '#f9d0d9',
    300: '#f4a8b8',
    400: '#ed7a93',
    500: '#e04d6f',
    600: '#c62d56',
    700: '#8C1F3D',  // ★ color primario (botones, tabs activas, acentos)
    800: '#771a34',
    900: '#5e1629',
    950: '#3a0a18',
  },

  gold: {
    50:  '#faf6ee',
    100: '#f3ebd4',
    200: '#e8d5a8',
    300: '#C8A568',  // ★ color secundario (dorado)
    400: '#c09a55',
    500: '#b08440',
    600: '#9a6b34',
    700: '#7d522c',
    800: '#694429',
    900: '#5a3a26',
    950: '#341e13',
  },
}
```

Colores semánticos: grises estándar de Tailwind (`gray-50`…`gray-900`) para fondos/texto/bordes, más `green-*` (éxito), `red-*` (peligro), `yellow-*` (advertencia), y un uso puntual de `blue-600` (botón editar estudiante en Admin).

Tipografía: sin `font-family` custom — stack sans-serif por defecto de Tailwind.
Iconos: **lucide-react** en todo el dashboard.

---

## Header global (`components/Layout/Header.tsx`)

Top navbar fijo, sin sidebar en ningún dashboard.

```
bg-white border-b border-gray-200
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
flex justify-between items-center py-4
```

- Izquierda: logo (`/images/logo.svg`, `h-10 w-auto`) + "CLUP Exámenes" (`text-xl font-bold text-gray-900`) + "Universidad Panamericana" (`text-sm text-gold-500`).
- Derecha: nombre/email + avatar circular (`p-2 bg-gray-100 rounded-full`, icono `User`) + badge de rol + botón Logout (`hover:bg-gray-50 rounded-lg`, icono `LogOut`).

Badge de rol por color:

| Rol | Clases |
|---|---|
| admin | `bg-wine-100 text-wine-800` |
| teacher | `bg-gold-100 text-gold-700` |
| student | `bg-wine-50 text-wine-700` |
| default | `bg-gray-100 text-gray-800` |

Contenedor raíz de todos los dashboards (`Layout.tsx`): `min-h-screen bg-gray-50` con `<Header />` arriba y `<main>` debajo.

---

## 1. Admin Dashboard (`components/Admin/AdminDashboard.tsx`)

### Header de página
```jsx
<h1 className="text-3xl font-bold text-gray-900 mb-2">
  {admin_type === 'language_academy' ? 'Language Academy Admin Dashboard' : 'Admin Dashboard'}
</h1>
<p className="text-gray-600">Welcome back, {user.name}! ...</p>
```

### Tabs — orden exacto en código

1. **Overview** (`overview`)
2. **Create Exam** (`create`)
3. **Manage People** (`assign`)
4. **Exam Assignments** (`assignments`)
5. **Question Bank** (`questions`)
6. **Exam Results** (`results`)

Estilo: fila con línea inferior, **underline** (no pill), sin iconos.

```jsx
// contenedor
"flex space-x-1 mb-8 border-b border-gray-200"

// cada tab
`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
  active
    ? 'border-wine-700 text-wine-700'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
}`
```

### Stat cards (tab Overview)
`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`

Card: `bg-gray-50 p-5 rounded-lg border border-gray-200` (+ `hover:bg-gray-100 hover:border-wine-200 cursor-pointer` si es clickeable). **Sin sombra** — el Admin usa bordes planos, no `shadow`.

| Stat | Icon chip | Icono lucide |
|---|---|---|
| Total Questions | `bg-wine-700` | `FileText` |
| Total Exams | `bg-gold-500` | `BookOpen` |
| Subjects | `bg-wine-900` | `Database` |
| New Questions | `bg-gold-300` | `Target` |

### Paneles Overview
`grid grid-cols-1 lg:grid-cols-2 gap-8`, cada panel `bg-white p-6 rounded-lg border border-gray-200`:
- **Recent Exams** — botón `+ New Exam` (`bg-wine-700 text-white hover:bg-wine-800 rounded-md`)
- **Question Banks** — lista de stats por materia

### Otros patrones de color
- Botón primario estándar: `bg-wine-700 hover:bg-wine-800 text-white`
- "Switch to Student View": `bg-green-600 hover:bg-green-700`
- "Switch to Teacher View": `bg-wine-700 hover:bg-wine-800`
- Badges de rol en listas: Language Admin `bg-wine-100 text-wine-800` · Admin `bg-red-100 text-red-800` · Teacher `bg-green-100 text-green-800` · Student `bg-gray-100 text-gray-800`
- Selección activa en listas: `border-wine-700 bg-wine-50`
- Caja de stats de asignación: `bg-gold-50 border border-gold-200 rounded-lg`
- Modal "All Exams" (`fixed inset-0 bg-black bg-opacity-50 z-50`): stat cards `bg-wine-50` / `bg-green-50` / `bg-gold-50`, icon chips `bg-wine-700` / `bg-green-500` / `bg-gold-400`
- Botón editar estudiante: `bg-blue-600 hover:bg-blue-700` (único azul del dashboard)

### Layout
- `max-w-7xl mx-auto p-6`
- Radio: predominan `rounded-lg` (8px) y `rounded-md` (6px); badges `rounded-full`
- Sombras: prácticamente ninguna
- Responsive: `md:` / `lg:` estándar en grids

---

## 2. Teacher Dashboard (`components/Teacher/TeacherDashboard.tsx`)

### Header de página
```jsx
<h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
<p className="text-gray-600">Welcome back, {user.name}! Manage your questions and track student progress.</p>
```
Si es admin viendo como teacher: badge `(Admin viewing as Teacher)` en `text-wine-700 font-medium` + botón "Back to Admin" (`bg-gray-600 hover:bg-gray-700`, icono `ArrowLeft`).

### Tabs — orden exacto en código

1. **Overview** (`overview`)
2. **Create Question** (`create`)

Estilo: **pill sólido**, sin línea divisoria, sin iconos.

```jsx
// contenedor
"flex space-x-1 mb-8"

// cada tab
`px-4 py-2 rounded-lg font-medium transition-colors ${
  active
    ? 'bg-wine-700 text-white'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
}`
```

### Alerta condicional
Sin materias asignadas: `bg-yellow-50 border-l-4 border-yellow-400 p-4`, icono `AlertTriangle` (`text-yellow-400`).

### Stat cards
`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`

Card: `bg-white p-6 rounded-xl shadow-lg` (aquí **sí** hay sombra, a diferencia del Admin).

| Stat | Icon chip | Icono lucide |
|---|---|---|
| Questions Created | `bg-wine-700` | `FileText` |
| Assigned Subjects | `bg-gold-500` | `BookOpen` |
| This Week | `bg-wine-900` | `TrendingUp` |
| Total Subjects/Questions | `bg-gold-300` | `Users` |

### Paneles inferiores
`grid grid-cols-1 lg:grid-cols-2 gap-8`, cards `bg-white p-6 rounded-xl shadow-lg`:
- **Recent Questions** — botón `+ New Question` (`bg-wine-700 hover:bg-wine-800`); items con `border-l-4 border-wine-700 pl-4`
- **Assigned Subjects** — items `bg-gray-50 rounded-lg`, icon chip `bg-wine-100` con icono `text-wine-700`

### Layout
- `max-w-7xl mx-auto p-6`
- Radio: `rounded-xl` (12px) predominante en cards
- Sombra: `shadow-lg` consistente

---

## 3. Student Dashboard (`components/Student/StudentDashboard.tsx`)

### Contenedor raíz
```jsx
<div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-7xl mx-auto">
```
Header propio dentro de una card (no texto plano como en Admin/Teacher):
```jsx
<div className="bg-white p-6 rounded-xl shadow-lg mb-6">
  <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
```
Botón "Back to Admin" si el rol fue cambiado: `bg-gray-600 hover:bg-gray-700`, icono `ArrowLeft`.
Loading state: spinner `w-16 h-16 border-4 border-wine-700 border-t-transparent rounded-full animate-spin`.

### Sección "Student Info" (3 cards fijas, sin tabs)
`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6`, cada card `bg-white p-6 rounded-xl shadow-lg`:

1. **Profile** — icono `User` (`text-wine-700`)
2. **Academic Info** — icono `BookOpen` (`text-gold-400`)
3. **Stats** — icono `FileText` (`text-wine-700`)

### Tabs — orden exacto en código

1. **Available Exams (N)** (`available`)
2. **Completed Exams (N)** (`completed`)

Estilo: underline (igual patrón que Admin), pero **anidado dentro de una card blanca** con `shadow-lg` — único dashboard donde las tabs viven dentro de un panel, no directo en el body.

```jsx
<div className="bg-white rounded-xl shadow-lg">
  <div className="border-b border-gray-200">
    <nav className="flex space-x-8 px-6">
      <button className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-wine-700 text-wine-700'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}>
```

### Exam cards
- Normal: `border rounded-lg p-6 hover:shadow-md transition-shadow border-gray-200`
- Adaptativo (`is_adaptive`): `border-gold-200 bg-gradient-to-br from-wine-50 to-gold-50` + badge `ADAPTIVE` (`bg-wine-100 text-wine-700 rounded-full`) — **único uso de gradiente** en los tres dashboards
- Botón "Start Exam": `bg-wine-700 hover:bg-wine-800` + icono `Play`
- Badge "Completed": `bg-green-100 text-green-700 rounded-full`
- Badge de duración: `bg-gold-100 text-gold-700 rounded-full`

`getGradeColor()`:

| Nota | Clases |
|---|---|
| ≥ 90 | `text-green-600 bg-green-100` |
| ≥ 80 | `text-wine-700 bg-wine-100` |
| ≥ 70 | `text-yellow-600 bg-yellow-100` |
| < 70 | `text-red-600 bg-red-100` |

### Layout
- Es el dashboard más "card heavy": header, 3 info cards y panel de tabs, todos en `rounded-xl` + `shadow-lg`
- Grid: `md:grid-cols-3` (info), `lg:grid-cols-2` (exam cards)

---

## Tabla comparativa de inconsistencias actuales

| Aspecto | Admin | Teacher | Student |
|---|---|---|---|
| Contenedor de tabs | Directo en body, `border-b border-gray-200` | Directo en body, sin borde | Dentro de card blanca `shadow-lg` |
| Estilo tab activa | Underline (`border-wine-700 text-wine-700`) | Pill sólido (`bg-wine-700 text-white`) | Underline (igual que Admin) |
| Radio de esquina (cards) | `rounded-lg` | `rounded-xl` | `rounded-xl` |
| Sombra en cards | Ninguna (solo `border`) | `shadow-lg` | `shadow-lg` |
| Gradientes | Ninguno | Ninguno | `from-wine-50 to-gold-50` (solo exámenes adaptativos) |
| Contenedor máximo | `max-w-7xl mx-auto p-6` | `max-w-7xl mx-auto p-6` | `max-w-7xl mx-auto` (padding en wrapper `p-6`) |
