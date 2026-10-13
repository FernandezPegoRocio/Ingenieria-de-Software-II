# Password Hasher: componente de custodia de contraseñas

> **Actividad asincrónica:** Modelo de Componentes (aplicación práctica)
> **Autora:** Rocío Fernández Pego
> **Basado en:** [cpp-component-model](https://github.com/gabrielinuz/cpp-component-model), el apunte *Componentes y Modelos de Componentes* y los *Acuerdos de Codificación y Nomenclatura en C++*
> **Estado:** propuesta. Este documento es un listado de requerimientos; todavía no hay implementación. Su viabilidad y factibilidad se analizan en la próxima clase.

---

## Índice

1. [Descripción](#1-descripción)
2. [Por qué merece ser un componente](#2-por-qué-merece-ser-un-componente)
3. [Alcance](#3-alcance)
4. [Contrato público (interfaz)](#4-contrato-público-interfaz)
5. [Requerimientos funcionales](#5-requerimientos-funcionales)
6. [Requerimientos del modelo de componentes](#6-requerimientos-del-modelo-de-componentes)
7. [Requerimientos no funcionales](#7-requerimientos-no-funcionales)
8. [Convenciones de código](#8-convenciones-de-código)
9. [Estructura de archivos propuesta](#9-estructura-de-archivos-propuesta)
10. [Dependencias](#10-dependencias)
11. [Criterios de aceptación](#11-criterios-de-aceptación)
12. [Riesgos y puntos abiertos](#12-riesgos-y-puntos-abiertos)
13. [Referencias](#13-referencias)

---

## 1. Descripción

**Password Hasher** es un componente que guarda y verifica contraseñas de forma segura. Recibe una contraseña en texto plano y devuelve un *hash* con sal (una cadena que no se puede revertir). Más tarde, dado un intento de contraseña y el hash guardado, informa si coinciden.

Se carga como biblioteca dinámica (`.so` en Linux, `.dll` en Windows) a través del `ModuleManager`, igual que el componente `Greeter` del repositorio. Quien lo usa (el *Host*) solo conoce la interfaz `IPasswordHasher`; no sabe qué algoritmo ni qué biblioteca criptográfica hay adentro.

**Ejemplo de uso previsto:** el servidor de contenidos *IntranEd* (ejemplo del repositorio) tiene un endpoint `POST /api/login`. Hoy ese ejemplo no necesita saber cómo se protegen las contraseñas; con este componente, delegaría esa tarea sin incorporar código criptográfico propio.

## 2. Por qué merece ser un componente

El apunte (basado en Sommerville) define cinco características que debe tener un componente. Así las cumple Password Hasher.

### Estandarizado

Respeta el modelo del repositorio: hereda de `IComponent`, exporta `get_api_version`, `create_component` y `destroy_component` con `extern "C"` y `noexcept`, y se instancia con `ModuleManager::create_instance<IPasswordHasher>()`.

### Independiente

No necesita ningún otro componente. Solo depende del sistema operativo (fuente de números aleatorios) y de una biblioteca criptográfica que viaja *dentro* del componente.

### Componible

Toda interacción pasa por la interfaz pública. Cualquier otro componente (por ejemplo, un servidor HTTP) puede usarlo sin conocer su código fuente.

### Implementable

Se entrega como un binario autocontenido (`.so` o `.dll`), sin que el Host tenga que compilarlo.

### Documentado

Este README define la sintaxis y la semántica de cada operación, sus códigos de resultado y sus límites.

### Razones propias de este dominio

- **Los algoritmos de contraseñas envejecen.** Hoy se recomienda Argon2id; hace unos años era bcrypt o PBKDF2. Cambiar el algoritmo no debería obligar a recompilar la aplicación: se reemplaza el binario del componente y se sube la versión del contrato si hace falta.
- **Lo sensible queda en un solo lugar.** Concentrar la criptografía en un módulo pequeño facilita auditarlo y probarlo, y evita que cada aplicación reimplemente algo delicado.
- **Se reutiliza tal cual.** Sirve a cualquier aplicación con inicio de sesión, sin cambios.

## 3. Alcance

### Dentro del alcance

- Generar el hash de una contraseña con sal aleatoria.
- Verificar una contraseña contra un hash guardado.
- Indicar si un hash guardado quedó desactualizado y conviene recalcularlo.

### Fuera del alcance

- Guardar usuarios o hashes (eso es responsabilidad de un componente de base de datos, como `IDatabase` del ejemplo SQLite).
- Manejo de sesiones, *tokens* o permisos.
- Cifrado reversible de datos.
- Políticas de contraseñas (largo mínimo, caracteres exigidos). Las define la aplicación.
- Interfaz gráfica o de red.

## 4. Contrato público (interfaz)

Archivo `include/i_password_hasher.hpp`. Todo lo que cruza la frontera es tipo C: `const char*`, `char*`, `size_t`, `int` y punteros. No cruzan `std::string`, `std::vector` ni excepciones.

```cpp
#ifndef I_PASSWORD_HASHER_HPP
#define I_PASSWORD_HASHER_HPP

#include <cstddef>
#include "i_component.hpp"

constexpr int PASSWORD_PROFILE_INTERACTIVE = 0;
constexpr int PASSWORD_PROFILE_MODERATE = 1;
constexpr std::size_t PASSWORD_HASH_MAX_SIZE = 128;
constexpr std::size_t PASSWORD_MAX_LENGTH = 1024;

class IPasswordHasher : public IComponent
{
    public:
        virtual ComponentResult hash_password(const char* password, int cost_profile,
                                              char* out_hash, std::size_t out_hash_size) noexcept = 0;

        virtual ComponentResult verify_password(const char* password, const char* stored_hash,
                                                int* out_match) noexcept = 0;

        virtual ComponentResult needs_rehash(const char* stored_hash, int cost_profile,
                                             int* out_needs_rehash) noexcept = 0;
};

#endif // I_PASSWORD_HASHER_HPP
```

### Decisiones de diseño

- **Una contraseña incorrecta no es un error.** `verify_password` no usa el valor de retorno para decir "no coincide": el resultado va en `out_match` (`1` coincide, `0` no) y el retorno es `SUCCESS`. Así se distingue "no coincide" de "algo falló".
- **Los métodos no guardan estado.** Reciben todo por parámetro. Eso los hace seguros entre hilos sin necesitar un mutex propio.
- **No se agregan códigos a `ComponentResult`.** Cambiarlo alteraría el contrato y obligaría a subir `CURRENT_API_VERSION`.

### Uso desde el Host (ilustrativo)

```cpp
ModuleManager gestor;
gestor.load_module("./lib/password_hasher");
auto hasher = gestor.create_instance<IPasswordHasher>("password_hasher");

char hash_guardado[PASSWORD_HASH_MAX_SIZE];
hasher->hash_password("mi_clave_secreta", PASSWORD_PROFILE_INTERACTIVE,
                      hash_guardado, sizeof(hash_guardado));

int coincide = 0;
hasher->verify_password("mi_clave_secreta", hash_guardado, &coincide);   // coincide == 1
```

## 5. Requerimientos funcionales

### RF-01. Sal aleatoria en cada hash

`hash_password` **debe** generar una sal aleatoria nueva en cada llamada, tomada de un generador criptográficamente seguro del sistema operativo.

### RF-02. Cadena autodescriptiva

`hash_password` **debe** devolver una cadena terminada en `'\0'` que incluya el algoritmo, sus parámetros, la sal y el hash (por ejemplo, el formato de cadena de Argon2: `$argon2id$v=19$m=...,t=...,p=...$sal$hash`). Así `verify_password` no necesita datos extra.

### RF-03. Hashes distintos para la misma contraseña

Dos llamadas a `hash_password` con la misma contraseña **deben** producir cadenas distintas.

### RF-04. Resultado de la verificación

`verify_password` **debe** poner `*out_match = 1` solo si la contraseña corresponde al hash, y `0` en cualquier otro caso.

### RF-05. Comparación en tiempo constante

`verify_password` **debe** tardar lo mismo cuando coincide que cuando no coincide, para no darle pistas a un atacante.

### RF-06. Detección de hashes desactualizados

`needs_rehash` **debe** poner `*out_needs_rehash = 1` si los parámetros del hash guardado son más débiles que los del perfil pedido, y `0` en caso contrario.

### RF-07. Perfiles de costo

El componente **debe** soportar al menos dos perfiles: `PASSWORD_PROFILE_INTERACTIVE` (inicio de sesión) y `PASSWORD_PROFILE_MODERATE` (datos de mayor sensibilidad).

### RF-08. Contraseña como bytes

Las contraseñas **deben** tratarse como bytes (UTF-8), sin alterarlas ni normalizarlas. El componente no impone un largo mínimo: eso lo decide la aplicación.

## 6. Requerimientos del modelo de componentes

Salen de los seis puntos de robustez del apunte.

### RM-01. C-API sin decorar y `noexcept`

*(Frontera del ABI segura.)* El componente **debe** exportar exactamente `get_api_version`, `create_component` y `destroy_component`, declaradas `extern "C"` y `noexcept`, para que el nombre no se decore (*name mangling*).

### RM-02. Métodos `noexcept`

*(Frontera del ABI segura.)* Todos los métodos de `IPasswordHasher` y el destructor **deben** ser `noexcept`.

### RM-03. Ninguna excepción sale del componente

*(Eliminación de excepciones cruzadas.)* Cada método **debe** envolver su trabajo en `try/catch(...)` y traducir cualquier fallo a un `ComponentResult`.

### RM-04. Solo tipos C en la interfaz

*(Tipos C++ estándar fuera de la frontera.)* La interfaz **no debe** exponer `std::string`, `std::vector` ni otros tipos de la biblioteca estándar. Solo `const char*`, `char*`, `size_t` e `int`.

### RM-05. Validación de argumentos

*(Eliminación de excepciones cruzadas.)* Los argumentos **deben** validarse al entrar. Un puntero nulo, un buffer menor a `PASSWORD_HASH_MAX_SIZE` o una contraseña mayor a `PASSWORD_MAX_LENGTH` devuelven `ERROR_INVALID_ARGUMENT` sin escribir fuera del buffer.

### RM-06. Quien reserva, libera

*(Gestión automática de memoria cruzada.)* El objeto **debe** crearse con `new` dentro de `create_component` y destruirse con `delete` dentro de `destroy_component`.

### RM-07. `shared_ptr` con *custom deleter*

*(Gestión automática de memoria cruzada.)* El Host **debe** recibir el componente como `std::shared_ptr<IPasswordHasher>` con un *deleter* que capture la biblioteca. Es el comportamiento que ya ofrece `ModuleManager::create_instance`, y evita descargar la biblioteca mientras exista un componente vivo.

### RM-08. Uso desde varios hilos

*(Seguridad de hilos y concurrencia primitiva.)* Los métodos **deben** poder llamarse a la vez desde varios hilos sobre la misma instancia. Si hay una inicialización global de la biblioteca criptográfica, debe ocurrir una sola vez y sin carreras.

### RM-09. Prohibido `std::exit`

*(Rechazo a `std::exit`.)* El componente **no debe** llamar a `std::exit`, `exit` ni `abort` por ninguna razón. Los fallos se informan por `ComponentResult`.

### RM-10. Versión del contrato

*(Control de versiones estricto.)* `get_api_version` **debe** devolver el valor de `CURRENT_API_VERSION` con el que se compiló el contrato. Si cambia la interfaz virtual, esa constante **debe** incrementarse.

## 7. Requerimientos no funcionales

### Seguridad

- **RNF-01.** El texto plano de la contraseña **no debe** guardarse, registrarse ni escribirse en ningún archivo, mensaje de error ni traza.
- **RNF-02.** Las copias internas de la contraseña y de los datos intermedios **deben** borrarse de memoria con una función que el compilador no pueda optimizar y eliminar (por ejemplo, `sodium_memzero` o `SecureZeroMemory`).
- **RNF-03.** **No se implementará criptografía propia.** El componente se apoyará en una biblioteca criptográfica reconocida.
- **RNF-04.** Los parámetros de costo por defecto **deben** seguir las recomendaciones vigentes de OWASP para Argon2id al momento de implementar.

### Rendimiento

- **RNF-05.** El perfil `PASSWORD_PROFILE_INTERACTIVE` **debería** tardar del orden de décimas de segundo por contraseña en un equipo común. Se busca que un atacante no pueda probar muchas contraseñas por segundo; el tiempo exacto se mide y se ajusta en la implementación.

### Portabilidad

- **RNF-06.** **Debe** compilar en Linux (`.so`) y Windows (`.dll`) con C++17, sin cambiar el código del componente.
- **RNF-07.** Ni el Host ni el componente **deben** depender de la versión del compilador del otro.

### Mantenibilidad

- **RNF-08.** Cambiar de algoritmo **no debe** requerir modificar el Host. Los hashes ya guardados siguen verificándose, porque la cadena indica con qué algoritmo se generó.

## 8. Convenciones de código

Siguen los *Acuerdos de Codificación y Nomenclatura en C++*.

### Nombres

- **Archivos:** `snake_case`. Por ejemplo, `password_hasher_component.cpp` e `i_password_hasher.hpp`.
- **Clases e interfaces:** `PascalCase`. Por ejemplo, `PasswordHasherComponent` e `IPasswordHasher`.
- **Funciones y métodos:** `snake_case`. Por ejemplo, `hash_password` y `verify_password`.
- **Variables locales y parámetros:** `snake_case`. Por ejemplo, `stored_hash` y `out_match`.
- **Atributos privados:** `snake_case` con guion bajo al final. Por ejemplo, `cost_profile_`.
- **Constantes y macros:** `UPPER_SNAKE_CASE`. Por ejemplo, `PASSWORD_HASH_MAX_SIZE`.

### Principios obligatorios

- **RAII:** prohibidos `new` y `delete` sueltos, salvo en las dos funciones de fábrica que exige el modelo.
- **SRP:** el componente solo hashea y verifica; no guarda usuarios ni habla de red.
- **Inmutabilidad por defecto:** todo lo que no cambia es `const`.

## 9. Estructura de archivos propuesta

```text
password_hasher/
├── README.md                        <- este documento
├── include/
│   ├── i_component.hpp              <- del modelo (sin cambios)
│   └── i_password_hasher.hpp        <- contrato público
└── src/
    └── password_hasher_component.cpp  <- implementación y C-API
```

El resultado de compilar es `lib/password_hasher.so` (Linux) o `lib/password_hasher.dll` (Windows).

## 10. Dependencias

### Otros componentes

Ninguna interfaz "requiere". Esto es lo que justifica la independencia.

### Del sistema operativo

Fuente de números aleatorios seguros (`getrandom` en Linux, `BCryptGenRandom` en Windows). La biblioteca criptográfica ya la usa internamente.

### De terceros (dentro del componente)

Una biblioteca criptográfica con Argon2id. El candidato principal es **libsodium** (`crypto_pwhash_str` y `crypto_pwhash_str_verify`). Debe enlazarse de forma estática o incluirse junto al componente para que quien lo use no tenga que instalarla.

## 11. Criterios de aceptación

El componente se considera listo cuando:

- [ ] Compila en Linux y en Windows sin advertencias.
- [ ] Un test con `static_assert` comprueba que la interfaz es pura y que los métodos y el destructor son `noexcept`.
- [ ] `get_api_version`, `create_component` y `destroy_component` aparecen sin decorar en la tabla de símbolos del binario.
- [ ] `hash_password` produce hashes distintos para la misma contraseña (RF-03).
- [ ] `verify_password` devuelve `out_match = 1` con la contraseña correcta y `0` con una incorrecta, sin devolver error (RF-04).
- [ ] Punteros nulos, buffer demasiado chico y contraseña demasiado larga devuelven `ERROR_INVALID_ARGUMENT` sin escribir fuera del buffer (RM-05).
- [ ] Una falla interna provocada a propósito llega al Host como `ERROR_INTERNAL`, sin excepción ni caída (RM-03).
- [ ] Con el `ModuleManager` destruido antes que el componente, la biblioteca sigue cargada hasta destruir el último componente (RM-07).
- [ ] Varios hilos hashean y verifican a la vez sobre la misma instancia y ThreadSanitizer no informa carreras (RM-08).
- [ ] Un componente de prueba con otra versión de ABI es rechazado por el Host (RM-10).
- [ ] Un análisis del código confirma que no hay llamadas a `std::exit` ni a `abort` (RM-09).

## 12. Riesgos y puntos abiertos

Cuestiones para analizar en la clase de viabilidad y factibilidad.

### Tamaño y licencia de la dependencia

Empaquetar libsodium dentro del componente aumenta el tamaño del binario y exige revisar su licencia (ISC) respecto de la licencia MIT del repositorio.

### Memoria que consume Argon2

Es intencionalmente costoso en memoria. Hay que evaluar el efecto en equipos modestos o con muchos inicios de sesión simultáneos.

### Buffer fijo

`PASSWORD_HASH_MAX_SIZE = 128` depende del formato de cadena de la biblioteca elegida. Si cambia el algoritmo, hay que verificarlo y, si crece, subir la versión del contrato.

### Configuración

Los perfiles son fijos. Falta decidir si conviene poder configurar costos por aplicación, y cómo hacerlo sin romper la regla de que los métodos no guardan estado.

### Clave secreta adicional (*pepper*)

No se considera una clave secreta adicional; su manejo requeriría un almacén de secretos que está fuera de alcance.

### Alcance del ejemplo

Para una clase práctica podría alcanzar una versión mínima (solo `hash_password` y `verify_password`). `needs_rehash` es el requerimiento más fácil de postergar.

## 13. Referencias

- Repositorio del modelo: [github.com/gabrielinuz/cpp-component-model](https://github.com/gabrielinuz/cpp-component-model)
- Apunte: *Componentes y Modelos de Componentes* (basado en Ian Sommerville)
- *Acuerdos de Codificación y Nomenclatura en C++*
- Sintaxis de Markdown: [markdown.es](https://markdown.es/)
- OWASP, *Password Storage Cheat Sheet*
- libsodium, documentación de *Password hashing*: [doc.libsodium.org](https://doc.libsodium.org/password_hashing)
