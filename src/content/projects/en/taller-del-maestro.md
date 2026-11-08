---
title: Taller del Maestro
description: Management system for device repair shops, with a desktop and web client built in Compose Multiplatform and a REST API in Quarkus.
date: 2026-09-18
tags: [Kotlin Multiplatform, Compose Multiplatform, Quarkus, Java, PostgreSQL]
role: Personal project · Design, frontend and backend
featured: true
images:
  - src: ../../../assets/projects/taller/inventario.png
    alt: Inventory screen with indicators for catalog items, stock below minimum and warehouse value
  - src: ../../../assets/projects/taller/movimientos.png
    alt: Inventory movement history with stock in, stock out and adjustments
  - src: ../../../assets/projects/taller/dispositivos.png
    alt: List of registered devices with their model, type and condition
---

## The problem

A repair shop juggles a lot at once: devices coming in for diagnosis, quotes the customer has to approve, spare parts in stock, over-the-counter sales and closing out the register every day. Doing all of that by hand or in spreadsheets leads to inventory errors, untracked payments and books that don't balance.

**Taller del Maestro** ("The Master's Workshop") brings that whole workflow into a single system. I designed and built it end to end: a desktop and web client, and the API behind it.

## What it does

- **Service orders** with their full lifecycle: intake, diagnosis, customer approval, repair, payment and delivery. A progress bar shows which step each order is at.
- **Inventory** with a parts catalog, stock levels with low-stock alerts, movements (in, out and adjustments), suppliers and bulk import.
- **Storefront** for over-the-counter sales with a multi-item cart that deducts inventory automatically.
- **Unified payments**: a single receipt can pay several orders or sales at once, with partial payments, voids and traceable refunds.
- **Financial close** by day, week and month: breakdown by payment method, cash discrepancy calculation and locking of periods that are already closed.
- **Users and technicians** with admin and technician roles.

## Architecture

The system is split into two repositories.

### Client — Kotlin Multiplatform + Compose Multiplatform

- A single codebase for **desktop (JVM)** and **web (Wasm/JS)**, with a Material 3 UI.
- **MVVM** architecture: Compose screens, ViewModels exposing state through `StateFlow`, and repositories that call the API with **Ktor Client**.
- Native installers for Windows (`.msi`/`.exe`) and Linux (`.deb`), built by **GitHub Actions**: every version tag compiles the binaries and publishes a release automatically.

### API — Quarkus (Java 21)

- **Quarkus** with Hibernate ORM / Panache on **PostgreSQL**, and versioned migrations with **Flyway**.
- Organized by domain (orders, devices, inventory, sales, payments, users), with separate layers for routes, services, entities and DTOs.
- Orders and sales follow **state machines validated on the backend**, so an order can't skip steps or be modified once it has been delivered or cancelled.
- Documented with **OpenAPI / Swagger UI** and tested with **JUnit 5, Mockito and REST-assured**.
- Packaged with **Docker**.

## Security

This is where I applied what I learned working on payment systems:

- Short-lived **RSA-signed JWTs** and rotating refresh tokens: if a token is reused, the whole session is revoked.
- Passwords hashed with **bcrypt**, and temporary account lockout after repeated failed logins.
- Single-use tokens (password reset, email verification) are stored only as a **SHA-256 hash**.
- Password recovery responds the same way whether or not the email exists, so it doesn't reveal which accounts are registered.
- **Voids** (fixing a same-day entry mistake) and **refunds** (returning money that was already booked) are separate operations, and each one keeps a trail of the money.

## Status

The system is under active development and is already at version 1.0.7. The latest improvements are pagination across every module and a user manual.
