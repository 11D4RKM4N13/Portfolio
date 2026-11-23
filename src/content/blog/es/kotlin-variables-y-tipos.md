---
title: 'Kotlin desde cero: variables y tipos de datos'
description: Aprende a declarar variables con val y var, cómo Kotlin infiere los tipos y por qué no convierte números por ti.
date: 2026-11-11
tags: [Kotlin, Fundamentos]
level: beginner
series: Kotlin desde cero
seriesOrder: 1
draft: false
---

Toda aplicación guarda datos mientras se ejecuta: el nombre de un usuario, el saldo de una cuenta, si una transacción fue aprobada o no. Las **variables** son el lugar donde guardamos esos datos, y los **tipos** le dicen al compilador qué clase de dato hay en cada una.

Kotlin es un lenguaje de **tipado estático**: el tipo de cada variable se conoce al compilar, no al ejecutar. Eso significa que muchos errores aparecen en el editor, antes de que la app llegue a un usuario.

## Qué vas a aprender

- La diferencia entre `val` y `var`, y cuál usar por defecto.
- Cómo Kotlin deduce el tipo de una variable sin que lo escribas.
- Los tipos básicos: números, texto, caracteres y booleanos.
- Por qué Kotlin te obliga a convertir números de forma explícita.

## `val` y `var`

En Kotlin hay dos formas de declarar una variable:

```kotlin
val nombre = "Ana"   // val: no se puede reasignar
var edad = 28        // var: se puede reasignar

edad = 29            // correcto
nombre = "Luis"      // error: Val cannot be reassigned
```

- **`val`** (de *value*) se asigna una sola vez. Es parecido a `final` en Java.
- **`var`** (de *variable*) se puede reasignar todas las veces que quieras.

**Regla práctica:** usa `val` siempre y cambia a `var` solo cuando de verdad necesites reasignar. El código donde los valores no cambian es más fácil de leer, de probar y de razonar, sobre todo cuando hay varios hilos de por medio.

## Inferencia de tipos

En los ejemplos anteriores no escribimos ningún tipo y aun así Kotlin sabe que `nombre` es un `String` y `edad` es un `Int`. Esto se llama **inferencia de tipos**: el compilador mira el valor inicial y deduce el tipo.

También puedes escribir el tipo explícitamente con dos puntos:

```kotlin
val nombre: String = "Ana"
val edad: Int = 28
```

Las dos versiones son equivalentes. El tipo explícito es útil cuando la variable no tiene valor inicial o cuando quieres dejar más clara la intención:

```kotlin
val saludo: String
if (edad >= 18) {
    saludo = "Bienvenida"
} else {
    saludo = "Hola"
}
```

Inferir el tipo **no** convierte a Kotlin en un lenguaje dinámico. Una vez que `edad` es `Int`, sigue siendo `Int`:

```kotlin
var edad = 28
edad = "veintiocho"  // error: Type mismatch
```

## Tipos básicos

| Tipo | Para qué sirve | Ejemplo |
| ---- | -------------- | ------- |
| `Int` | Enteros (32 bits) | `val cantidad = 42` |
| `Long` | Enteros grandes (64 bits) | `val habitantes = 8_000_000_000L` |
| `Double` | Decimales | `val precio = 19.99` |
| `Float` | Decimales con menos precisión | `val temperatura = 21.5f` |
| `Boolean` | Verdadero o falso | `val aprobado = true` |
| `Char` | Un solo carácter | `val inicial = 'A'` |
| `String` | Texto | `val ciudad = "Bogotá"` |

Algunos detalles que vale la pena conocer:

- Un número entero sin sufijo es `Int`. Si no cabe en un `Int`, Kotlin lo trata como `Long`, y también puedes forzarlo con el sufijo `L`.
- Un número decimal sin sufijo es `Double`. Para un `Float` necesitas el sufijo `f`.
- Puedes usar guiones bajos para que los números largos se lean mejor: `1_000_000`.
- Los `Char` van entre comillas simples (`'A'`) y los `String` entre comillas dobles (`"A"`).

### Plantillas de texto

Para meter valores dentro de un texto no hace falta concatenar con `+`. Usa `$` para una variable y `${}` para una expresión:

```kotlin
val nombre = "Ana"
val productos = 3
val total = 59.97

println("Hola, $nombre")
println("Llevas $productos productos por un total de $total")
println("En promedio: ${total / productos}")
```

## Las conversiones son explícitas

Aquí Kotlin se diferencia de Java. En Java puedes asignar un `int` a un `long` y el lenguaje lo convierte solo. En Kotlin no:

```kotlin
val cantidad: Int = 10
val grande: Long = cantidad          // error: Type mismatch
val grandeOk: Long = cantidad.toLong() // correcto
```

Cada tipo numérico tiene funciones de conversión: `toInt()`, `toLong()`, `toDouble()`, `toFloat()`... y `String` tiene sus equivalentes para leer números a partir de texto:

```kotlin
val texto = "250"
val numero = texto.toInt()           // 250

val invalido = "abc".toIntOrNull()   // null, en lugar de lanzar una excepción
```

Puede parecer más trabajo, pero evita errores silenciosos como perder decimales o desbordar un número sin darte cuenta.

## Un caso real

Imagina el resumen de un pago en una app. Los montos se manejan en **centavos** con `Long` para evitar los errores de redondeo de los decimales, y solo se convierten a `Double` para mostrarlos:

```kotlin
const val MONEDA = "COP"

fun main() {
    val montoCentavos: Long = 2_550_000   // 25.500,00
    val propinaCentavos = 255_000L
    var intentos = 0

    intentos++                             // primer intento de pago
    val totalCentavos = montoCentavos + propinaCentavos
    val aprobado = totalCentavos <= 5_000_000

    println("Total: ${totalCentavos / 100.0} $MONEDA")
    println("Intentos: $intentos · Aprobado: $aprobado")
}
```

Fíjate en las decisiones:

- `const val` sirve para constantes conocidas al compilar (números, booleanos o textos) declaradas fuera de una función o dentro de un `object`.
- Casi todo es `val`. Solo `intentos` es `var`, porque cambia.
- `totalCentavos / 100.0` da un `Double` porque uno de los operandos es `Double`. Si dividieras entre `100`, sería una división entera y perderías los centavos.

## Errores comunes

- **Usar `var` "por si acaso".** Si nunca reasignas la variable, el IDE te sugerirá cambiarla a `val`. Hazle caso.
- **Creer que `val` hace inmutable el contenido.** `val` impide reasignar la variable, pero no impide modificar el objeto al que apunta:

  ```kotlin
  val lista = mutableListOf(1, 2)
  lista.add(3)        // funciona: la lista cambia
  lista = mutableListOf() // error: no se puede reasignar
  ```

- **Dividir enteros esperando decimales.** `7 / 2` es `3`, no `3.5`. Usa `7 / 2.0` o convierte con `toDouble()`.
- **Convertir texto con `toInt()` sin validar.** Si el texto no es un número, lanza `NumberFormatException`. Cuando el dato viene del usuario, prefiere `toIntOrNull()`.

## Resumen

- Usa `val` por defecto y `var` solo cuando necesites reasignar.
- Kotlin infiere los tipos, pero sigue siendo un lenguaje de tipado estático.
- Los tipos básicos son `Int`, `Long`, `Double`, `Float`, `Boolean`, `Char` y `String`.
- Las conversiones entre tipos numéricos siempre son explícitas.

En el próximo artículo veremos qué pasa con `toIntOrNull()` cuando devuelve `null`, y cómo Kotlin usa el sistema de tipos para evitar el famoso `NullPointerException`.

## Para practicar

Escribe un programa que:

1. Guarde en un `val` el precio de un producto como texto (`"12500"`) y lo convierta a `Long`.
2. Guarde en un `var` la cantidad de unidades y súmale una.
3. Imprima con una plantilla de texto: `"3 unidades x 12500 = 37500"`.

Pruébalo directamente en el navegador en [play.kotlinlang.org](https://play.kotlinlang.org).
