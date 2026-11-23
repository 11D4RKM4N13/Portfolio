---
title: ISO 8583 Lab
description: Android app to build, send and parse ISO 8583 messages, with a simulated processor that answers over TCP on the same device.
date: 2026-11-23
tags: [Android, Kotlin, Jetpack Compose, ISO 8583, Payments]
repo: https://github.com/11D4RKM4N13/Iso8583Lab
role: Personal project · Design and development
images:
  - src: ../../../assets/projects/iso8583lab/compra-formulario.png
    alt: Form for a 0200 purchase with PAN, processing code, amount, STAN, terminal and currency
  - src: ../../../assets/projects/iso8583lab/compra-solicitud.png
    alt: Packed 0200 request broken down into MTI, primary bitmap and each field
  - src: ../../../assets/projects/iso8583lab/compra-respuesta.png
    alt: Approved 0210 response from the simulator with RRN, authorization code and response code 00
  - src: ../../../assets/projects/iso8583lab/eco-formulario.png
    alt: Form for a 0800 echo message with date, STAN and network management code
  - src: ../../../assets/projects/iso8583lab/eco-solicitud.png
    alt: Packed 0800 message with a secondary bitmap for field 70
  - src: ../../../assets/projects/iso8583lab/eco-respuesta.png
    alt: Approved 0810 response broken down field by field
  - src: ../../../assets/projects/iso8583lab/analizar.png
    alt: Parse screen unpacking an ISO 8583 message pasted as ASCII
---

## The idea

ISO 8583 is the format that card terminals, switches and card issuers speak. It's easy to describe and hard to see: a message is a string of digits where a bitmap says which fields are present and each field has its own length format.

**ISO 8583 Lab** turns that string into something you can poke at. It's the companion app to the blog series *ISO 8583 en la práctica* (in Spanish): the code from the articles running on a phone.

## What it does

- **Pack**: purchase (**0200**) and network echo (**0800**) templates. You fill in the fields and the app builds the message, computes the bitmap (primary, plus secondary when needed) and shows the message broken down part by part.
- **Send to the simulator**: the request travels over **TCP** to a test processor running on the same device, and the response (0210, 0810) is shown decoded along with its response code.
- **Parse**: paste an ASCII message with a hex bitmap and the app unpacks it field by field.

The simulator follows simple rules so different cases can be tested: it approves purchases and assigns them an RRN and authorization code, answers **51 (insufficient funds)** when the amount is over 100,000.00, and approves echoes and reversals.

## How it's built

- **Kotlin + Jetpack Compose** with Material 3 and a **ViewModel** that exposes each screen's state.
- The field specification is defined with a **Kotlin DSL** (`isoSpec { numeric(4, 12, "Amount") ... }`), supporting fixed, LLVAR and LLLVAR fields.
- 64- and 128-bit **bitmaps** with `LongArray` and extension functions, plus **BCD** encoding.
- A **coroutine-based TCP client** that uses a 2-byte length header and checks that the response matches the request.
- If the response doesn't arrive in time, the client sends a **reversal (0400)**: a timeout isn't a decline, because we don't know whether the issuer approved.
- The simulated processor is a `ServerSocket` on `127.0.0.1` that handles each connection in its own coroutine.
- **Unit tests** with JUnit for the packer, bitmap, BCD and the simulator's rules.
