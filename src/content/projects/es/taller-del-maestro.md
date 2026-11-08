---
title: Taller del Maestro
description: Sistema de gestión para talleres de reparación de dispositivos, con cliente de escritorio y web en Compose Multiplatform y una API REST en Quarkus.
date: 2026-09-18
tags: [Kotlin Multiplatform, Compose Multiplatform, Quarkus, Java, PostgreSQL]
role: Proyecto propio · Diseño, frontend y backend
featured: true
images:
  - src: ../../../assets/projects/taller/inventario.png
    alt: Pantalla de inventario con indicadores de ítems en catálogo, stock bajo mínimo y valor en bodega
  - src: ../../../assets/projects/taller/movimientos.png
    alt: Historial de movimientos de inventario con entradas, salidas y ajustes
  - src: ../../../assets/projects/taller/dispositivos.png
    alt: Listado de dispositivos registrados con su modelo, tipo y estado
---

## El problema

Un taller de reparación maneja muchas piezas a la vez: equipos que entran a diagnóstico, presupuestos que el cliente debe autorizar, repuestos en bodega, ventas de mostrador y el cierre de caja de cada día. Hacer todo eso a mano o en hojas de cálculo produce errores de inventario, pagos sin rastrear y cuentas que no cuadran.

**Taller del Maestro** reúne todo ese flujo en un solo sistema. Lo diseñé y desarrollé de principio a fin: un cliente de escritorio y web, y la API que lo respalda.

## Qué hace

- **Órdenes de servicio** con todo su ciclo: recepción, diagnóstico, autorización del cliente, reparación, pago y entrega. Una barra de progreso muestra en qué paso va cada orden.
- **Inventario** con catálogo de partes, stock con alertas de mínimo, movimientos (entradas, salidas y ajustes), proveedores y carga masiva.
- **Vitrina** para ventas de mostrador con carrito de varios ítems, que descuentan el inventario automáticamente.
- **Pagos unificados**: un mismo recibo puede pagar varias órdenes o ventas a la vez, con pagos parciales, anulaciones y reembolsos rastreables.
- **Cierre financiero** por día, semana y mes: desglose por método de pago, cálculo de la diferencia de caja y bloqueo de los periodos ya cerrados.
- **Usuarios y técnicos** con roles de administrador y técnico.

## Arquitectura

El sistema está dividido en dos repositorios.

### Cliente — Kotlin Multiplatform + Compose Multiplatform

- Una sola base de código para **escritorio (JVM)** y **web (Wasm/JS)**, con interfaz en Material 3.
- Arquitectura **MVVM**: pantallas en Compose, ViewModels con estado en `StateFlow` y repositorios que consumen la API con **Ktor Client**.
- Instaladores nativos para Windows (`.msi`/`.exe`) y Linux (`.deb`), generados por **GitHub Actions**: cada tag de versión compila los binarios y publica un *release* automáticamente.

### API — Quarkus (Java 21)

- **Quarkus** con Hibernate ORM / Panache sobre **PostgreSQL**, y migraciones versionadas con **Flyway**.
- Organizada por dominio (órdenes, dispositivos, inventario, ventas, pagos, usuarios), con capas separadas de rutas, servicios, entidades y DTOs.
- Las órdenes y las ventas siguen **máquinas de estado validadas en el backend**, de modo que una orden no puede saltarse pasos ni modificarse una vez entregada o cancelada.
- Documentación con **OpenAPI / Swagger UI** y pruebas con **JUnit 5, Mockito y REST-assured**.
- Empaquetada con **Docker**.

## Seguridad

Aquí apliqué lo que aprendí trabajando en sistemas de pago:

- **JWT firmado con RSA** de corta duración y *refresh tokens* con rotación: si alguien reutiliza un token, se revoca toda la sesión.
- Contraseñas con **bcrypt** y bloqueo temporal de la cuenta tras varios intentos fallidos.
- Los tokens de un solo uso (recuperación de contraseña, verificación de email) se guardan solo como **hash SHA-256**.
- La recuperación de contraseña responde igual exista o no el correo, para no revelar qué cuentas están registradas.
- **Anulación** (corregir un error el mismo día) y **reembolso** (devolver dinero ya contabilizado) son operaciones distintas, y cada una deja trazabilidad del dinero.

## Estado

El sistema está en desarrollo activo y ya va por la versión 1.0.7. Las mejoras más recientes son la paginación en todos los módulos y un manual de usuario.
