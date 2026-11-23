---
title: ISO 8583 Lab
description: App Android para construir, enviar y analizar mensajes ISO 8583, con un procesador simulado que responde por TCP dentro del mismo dispositivo.
date: 2026-11-23
tags: [Android, Kotlin, Jetpack Compose, ISO 8583, Pagos]
repo: https://github.com/11D4RKM4N13/Iso8583Lab
role: Proyecto propio · Diseño y desarrollo
images:
  - src: ../../../assets/projects/iso8583lab/compra-formulario.png
    alt: Formulario de una compra 0200 con PAN, código de procesamiento, monto, STAN, terminal y moneda
  - src: ../../../assets/projects/iso8583lab/compra-solicitud.png
    alt: Solicitud 0200 empaquetada y desglosada en MTI, bitmap primario y cada campo
  - src: ../../../assets/projects/iso8583lab/compra-respuesta.png
    alt: Respuesta 0210 aprobada del simulador con RRN, código de autorización y código de respuesta 00
  - src: ../../../assets/projects/iso8583lab/eco-formulario.png
    alt: Formulario de un mensaje de eco 0800 con fecha, STAN y código de gestión de red
  - src: ../../../assets/projects/iso8583lab/eco-solicitud.png
    alt: Mensaje 0800 empaquetado con bitmap secundario para el campo 70
  - src: ../../../assets/projects/iso8583lab/eco-respuesta.png
    alt: Respuesta 0810 aprobada desglosada campo por campo
  - src: ../../../assets/projects/iso8583lab/analizar.png
    alt: Pantalla de análisis que desempaqueta un mensaje ISO 8583 pegado en ASCII
---

## La idea

ISO 8583 es el formato con el que hablan los datáfonos, los switches y los emisores de tarjetas. Es fácil de describir y difícil de ver: un mensaje es una tira de dígitos donde un bitmap dice qué campos vienen y cada campo tiene su propio formato de longitud.

**ISO 8583 Lab** convierte esa tira en algo que se puede tocar. Es la app que acompaña la serie [ISO 8583 en la práctica](/Portfolio/blog/iso8583/) del blog: el código de los artículos funcionando en un teléfono.

## Qué hace

- **Empaquetar**: plantillas de compra (**0200**) y eco de red (**0800**). Llenas los campos y la app arma el mensaje, calcula el bitmap (primario y secundario cuando hace falta) y muestra el mensaje desglosado parte por parte.
- **Enviar al simulador**: la solicitud viaja por **TCP** a un procesador de prueba que corre en el mismo dispositivo, y la respuesta (0210, 0810) se muestra decodificada con su código de respuesta.
- **Analizar**: pegas un mensaje en ASCII con bitmap hexadecimal y la app lo desempaqueta campo por campo.

El simulador sigue reglas simples para poder probar distintos casos: aprueba las compras y les asigna RRN y código de autorización, responde **51 (fondos insuficientes)** cuando el monto supera 100.000,00, y aprueba ecos y reversos.

## Cómo está hecho

- **Kotlin + Jetpack Compose** con Material 3 y un **ViewModel** que expone el estado de cada pantalla.
- La especificación de campos se define con un **DSL de Kotlin** (`isoSpec { numeric(4, 12, "Monto") ... }`), con campos fijos, LLVAR y LLLVAR.
- **Bitmap** de 64 y 128 bits con `LongArray` y funciones de extensión, y codificación **BCD**.
- **Cliente TCP con coroutines** que usa una cabecera de longitud de 2 bytes y comprueba que la respuesta corresponda a la solicitud.
- Si la respuesta no llega a tiempo, el cliente envía un **reverso (0400)**: un timeout no es un rechazo, porque no sabemos si el emisor aprobó.
- El procesador simulado es un `ServerSocket` en `127.0.0.1` que atiende cada conexión en su propia coroutine.
- **Pruebas unitarias** con JUnit para el empaquetador, el bitmap, el BCD y las reglas del simulador.
