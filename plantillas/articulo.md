---
# Copia este archivo en src/content/blog/es/<slug>.md (y su traducción con el MISMO
# nombre en src/content/blog/en/). El nombre del archivo es la URL: /blog/<slug>/
# Usa slugs cortos, en minúsculas y con guiones: kotlin-null-safety, poo-herencia...
title: Título claro que diga qué se aprende
description: Una o dos frases. Se muestra en el listado, en buscadores y en el RSS.
date: 2026-11-11
# updated: 2026-12-01            # cuando hagas una revisión importante
tags: [Kotlin, POO]              # temas; reutiliza siempre la misma escritura
level: beginner                  # beginner | intermediate | advanced
# series: Kotlin desde cero      # opcional: mismo texto en todos los artículos de la serie
# seriesOrder: 1                 # obligatorio si hay series
draft: true                      # se ve en `astro dev`, no se publica hasta poner false
---

Uno o dos párrafos: qué problema resuelve el concepto y por qué importa.

## Qué vas a aprender

- Idea 1
- Idea 2
- Idea 3

## El concepto

Explicación en lenguaje sencillo. Si ayuda, una analogía o una tabla comparativa:

| Java | Kotlin |
| ---- | ------ |
| `String nombre = null;` | `val nombre: String? = null` |

## Ejemplo

Empieza por el caso mínimo que funcione:

```kotlin
data class Usuario(val nombre: String, val email: String?)

fun main() {
    val usuario = Usuario("Ana", null)
    println(usuario.email?.length ?: "sin email")
}
```

Explica qué hace cada parte importante del código.

## Un caso real

El mismo concepto aplicado a algo que te encontrarías en un proyecto (Android, APIs, pagos...).

## Errores comunes

- Error típico y cómo evitarlo.

## Resumen

- Punto clave 1
- Punto clave 2

## Para practicar

Un ejercicio corto para que el lector lo pruebe por su cuenta.
