# 02 — User Personas

## 1. Objetivo

Definir **quién** usa GORAZUS, para que cada pantalla diseñada en `07_SCREEN_CATALOG.md` tenga un usuario concreto en mente, no un "usuario genérico". Ninguna persona de este documento existía por escrito antes — se derivan de los permisos ya fijados por módulo (`docs/menus/00-convenciones.md`, patrón `<modulo>.<accion>`) y del catálogo de 27 módulos (`docs/architecture/04-catalogo-modulos-negocio.md`).

## 2. Alcance

8 personas primarias, una por patrón de uso dominante. No son roles RBAC literales (`docs/architecture/15-modulo-security.md` define los roles técnicos) — una persona puede mapear a varios roles, y una empresa chica puede tener una sola persona real cubriendo 3 de estas.

## 3. Catálogo de personas

### 3.1 Cajero / Vendedor de mostrador — "Miguel"

```
┌──────────────────────────────────────────────────────────┐
│ MIGUEL, 24 años — Cajero de mostrador                     │
├──────────────────────────────────────────────────────────┤
│ Módulos:     POS, Caja, Clientes (consulta)               │
│ Dispositivo: PC de mostrador + lector código de barras +  │
│              impresora fiscal                              │
│ Frecuencia:  8 horas/día, ~80-150 ventas/día               │
│ Nivel técnico: Bajo — no tolera sistemas lentos o con      │
│              muchos pasos                                  │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Cobrar rápido, sin errores, sin que se forme  │
│              cola.                                          │
│ Frustración: Sistemas que piden confirmar 3 veces una       │
│              venta simple, o que se traban con el mouse.    │
│ Cita:        "Si tengo que buscar el producto en un menú,   │
│              ya perdí al cliente."                          │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Venta estándar (efectivo, producto conocido)   │
│              en <5 interacciones, 100% teclado/lector.       │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Ejecutivo de Ventas — "Daniela"

```
┌──────────────────────────────────────────────────────────┐
│ DANIELA, 31 años — Ejecutiva de ventas mayoristas          │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Ventas, CRM, Clientes, Productos (consulta)   │
│ Dispositivo: Laptop en oficina, celular en visita a         │
│              cliente (responsive/PWA)                       │
│ Frecuencia:  Diaria, cotizaciones y seguimiento de           │
│              oportunidades                                  │
│ Nivel técnico: Medio                                        │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Cotizar rápido desde el celular en la visita, │
│              hacer seguimiento sin perder oportunidades.     │
│ Frustración: Tener que volver a la oficina para pasar una   │
│              cotización a un sistema separado del CRM.       │
│ Cita:        "Si el cliente pide precio y no se lo mando en │
│              el momento, se lo compra a otro."               │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Cotización generada y enviada desde el celular │
│              en la misma visita.                             │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Encargado de Compras — "Roberto"

```
┌──────────────────────────────────────────────────────────┐
│ ROBERTO, 45 años — Encargado de compras                    │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Compras, Proveedores, Inventario (consulta)   │
│ Dispositivo: PC de escritorio, oficina                      │
│ Frecuencia:  Diaria — revisa stock bajo, genera órdenes     │
│ Nivel técnico: Medio                                        │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    No quedarse sin stock de lo que más rota, sin  │
│              sobre-comprar lo que no rota.                   │
│ Frustración: Enterarse del quiebre de stock cuando ya un    │
│              vendedor le avisó que no hay producto.          │
│ Cita:        "Necesito ver qué se está por acabar ANTES de  │
│              que se acabe, no después."                      │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Alerta proactiva de stock mínimo con la orden  │
│              de compra pre-armada al proveedor habitual.     │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Encargado de Almacén — "Carla"

```
┌──────────────────────────────────────────────────────────┐
│ CARLA, 29 años — Encargada de almacén                      │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Inventario, Compras (recepción)                │
│ Dispositivo: Tablet/celular en el almacén, PC para reportes │
│ Frecuencia:  Diaria — recepciones, transferencias, conteos  │
│ Nivel técnico: Bajo-medio                                    │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Que el stock del sistema coincida con el stock │
│              físico, sin hacer doble trabajo en papel.       │
│ Frustración: Contar inventario en una planilla y después     │
│              transcribirlo a mano al sistema.                 │
│ Cita:        "Si cuento con el lector, tiene que quedar       │
│              registrado ahí mismo, no en un Excel aparte."    │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Conteo cíclico con lector de código de barras   │
│              directo desde el celular, ajuste automático.     │
└──────────────────────────────────────────────────────────┘
```

### 3.5 Contador / Administrador Financiero — "Fernando"

```
┌──────────────────────────────────────────────────────────┐
│ FERNANDO, 38 años — Contador / administrador financiero     │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Contabilidad, Caja, Bancos, Impuestos,          │
│              Tesorería, Reportes                             │
│ Dispositivo: PC de escritorio, doble monitor                 │
│ Frecuencia:  Diaria (conciliación) + intensiva a fin de mes  │
│              (cierre)                                        │
│ Nivel técnico: Medio-alto (experto en su dominio, no en TI)  │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Cerrar el mes sin sorpresas, con estados        │
│              financieros que cuadren a la primera.            │
│ Frustración: Tener que investigar a mano por qué un asiento  │
│              automático no cuadra, sin ver el origen.          │
│ Cita:        "Necesito poder hacer clic en un número del      │
│              balance y llegar hasta la factura que lo         │
│              originó."                                        │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Trazabilidad completa de cualquier cifra hasta  │
│              su documento origen, en 2 clics.                 │
└──────────────────────────────────────────────────────────┘
```

### 3.6 Gerente General / Dueño — "Patricia"

```
┌──────────────────────────────────────────────────────────┐
│ PATRICIA, 52 años — Dueña, 4 sucursales                     │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Dashboard, BI, Reportes — vista consolidada     │
│              multisucursal, casi nunca captura datos          │
│ Dispositivo: Celular (fuera de oficina), tablet, laptop      │
│ Frecuencia:  Varias veces al día, sesiones cortas             │
│ Nivel técnico: Bajo-medio                                    │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Saber "cómo venimos" sin tener que pedirle el   │
│              dato a nadie ni esperar un reporte armado a mano.│
│ Frustración: Que cada sucursal tenga su Excel y los números   │
│              no cuadren entre sí al consolidar.                │
│ Cita:        "Quiero abrir el celular y saber si hoy fue      │
│              buen día o mal día, sin llamar a nadie."          │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Dashboard consolidado (todas las sucursales)     │
│              cargando en <2 segundos desde el celular.         │
└──────────────────────────────────────────────────────────┘
```

### 3.7 Administrador de Sistema — "Iván"

```
┌──────────────────────────────────────────────────────────┐
│ IVÁN, 33 años — Administrador de sistema / IT                │
├──────────────────────────────────────────────────────────┤
│ Módulos:     Seguridad, Configuración, Administración         │
│ Dispositivo: PC de escritorio                                │
│ Frecuencia:  Alta al inicio (onboarding), baja en régimen     │
│              (altas de usuario, ajustes puntuales)             │
│ Nivel técnico: Alto                                           │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Dar de alta usuarios/roles/sucursales sin tener  │
│              que escribir un ticket a soporte por cada cosa.   │
│ Frustración: Sistemas donde un permiso mal puesto se           │
│              descubre porque alguien vio algo que no debía.     │
│ Cita:        "Necesito ver de un vistazo qué puede hacer cada  │
│              rol, no adivinar leyendo 40 checkboxes."           │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Matriz de permisos por rol visible y editable en │
│              una sola pantalla, con vista previa del efecto.    │
└──────────────────────────────────────────────────────────┘
```

### 3.8 Responsable de RRHH — "Sofía"

```
┌──────────────────────────────────────────────────────────┐
│ SOFÍA, 36 años — Responsable de RRHH y nómina                │
├──────────────────────────────────────────────────────────┤
│ Módulos:     RRHH, Nómina                                     │
│ Dispositivo: PC de escritorio                                │
│ Frecuencia:  Mensual (nómina) + diaria (asistencia,           │
│              vacaciones)                                       │
│ Nivel técnico: Medio                                          │
├──────────────────────────────────────────────────────────┤
│ Objetivo:    Correr la nómina del mes sin errores de cálculo  │
│              de retenciones/beneficios.                        │
│ Frustración: Recalcular a mano cuando alguien pide un          │
│              adelanto o falta días a mitad de mes.              │
│ Cita:        "Si el empleado faltó 3 días, el sistema tiene    │
│              que descontarlo solo, no yo con calculadora."      │
├──────────────────────────────────────────────────────────┤
│ Éxito:       Nómina mensual corrida y verificada en menos de  │
│              media jornada.                                     │
└──────────────────────────────────────────────────────────┘
```

## 4. Matriz persona → módulo principal

| Persona             | Módulo primario | Módulos secundarios                | Frecuencia                        |
| ------------------- | --------------- | ---------------------------------- | --------------------------------- |
| Miguel (Cajero)     | POS             | Caja, Clientes                     | Diaria, alto volumen              |
| Daniela (Ventas)    | Ventas          | CRM, Clientes                      | Diaria                            |
| Roberto (Compras)   | Compras         | Proveedores, Inventario            | Diaria                            |
| Carla (Almacén)     | Inventario      | Compras (recepción)                | Diaria                            |
| Fernando (Contador) | Contabilidad    | Caja, Bancos, Impuestos, Tesorería | Diaria + pico mensual             |
| Patricia (Dueña)    | Dashboard       | BI, Reportes                       | Varias veces al día, sesión corta |
| Iván (IT)           | Seguridad       | Configuración, Administración      | Alta al inicio, baja en régimen   |
| Sofía (RRHH)        | RRHH            | Nómina                             | Mensual + diaria (asistencia)     |

## 5. Buenas prácticas

- Toda pantalla nueva en `07_SCREEN_CATALOG.md` debe poder responder "¿para cuál de estas 8 personas es la pantalla primaria?" — si la respuesta es "para todas por igual", revisar si la pantalla está intentando servir demasiados casos de uso a la vez.
- Las citas son la vara de "éxito" — si un flujo diseñado no resuelve la cita textual de la persona, no está terminado.

## 6. Reglas

- No agregar una persona nueva sin antes verificar que no está ya cubierta por una combinación de las 8 (evita fragmentación innecesaria — mismo principio KISS que el resto del proyecto).
- Los nombres son ficticios, no corresponden a personas reales — se usan solo para dar continuidad narrativa entre documentos (`03_USER_JOURNEYS.md` los reutiliza).
