---
title: 'ISO 8583 en la práctica: implementación idiomática en Kotlin'
description: Llevamos el empaquetador ISO 8583 a Kotlin con un DSL para construir mensajes, codificación BCD, un cliente TCP con coroutines y pruebas unitarias.
date: 2026-11-23
tags: [ISO 8583, Pagos, Kotlin]
level: advanced
series: ISO 8583 en la práctica
seriesOrder: 3
draft: false
---

En la parte 2 construimos en Java un empaquetador y un parser ISO 8583 completos. Funcionan, pero el código tiene bastante ceremonia: builders manuales, `switch` con `yield`, validaciones repetidas. Kotlin nos permite expresar lo mismo con menos ruido y, sobre todo, hacer que el código que **usa** la librería se lea casi como la especificación del procesador.

Si trabajas en Android (por ejemplo, integrando un datáfono o un lector de tarjetas), esta es probablemente la versión que terminarás usando.

## Qué vas a aprender

- Cómo definir la especificación y los mensajes con DSL de Kotlin.
- Cómo calcular el bitmap con `LongArray` y funciones de extensión.
- Cómo codificar campos numéricos en BCD y por qué ahorra la mitad de los bytes.
- Cómo enviar mensajes con coroutines, validar la respuesta y manejar el timeout.
- Cómo probar el empaquetador con `kotlin.test`.

## De Java a Kotlin

Antes de entrar al código, este es el resumen de lo que cambia:

| Pieza | Java (parte 2) | Kotlin |
| ----- | -------------- | ------ |
| Especificación | Métodos encadenados `.field(...)` | DSL `isoSpec { numeric(...) }` |
| Mensaje | Clase mutable con `set` | `data class` inmutable con DSL `isoMessage { }` |
| Bitmap | `byte[]` y máscaras | `LongArray` con extensiones |
| Relleno | `"0".repeat(n) + value` | `padStart` / `padEnd` |
| Validación | `if` + `throw` | `require` / `check` |
| Red | Hilo bloqueado | `suspend` + `Dispatchers.IO` |

## La especificación como DSL

Los tipos base son los mismos que en Java:

```kotlin
enum class LengthType(val prefixDigits: Int) { FIXED(0), LLVAR(2), LLLVAR(3) }

enum class ContentType { NUMERIC, ALPHANUMERIC }

data class FieldSpec(
    val number: Int,
    val lengthType: LengthType,
    val content: ContentType,
    val maxLength: Int,
    val name: String,
)

class IsoSpec(private val fields: Map<Int, FieldSpec>) {
    operator fun get(number: Int): FieldSpec =
        fields[number] ?: throw IllegalArgumentException("Campo $number no definido en la especificación")
}
```

Lo nuevo es el builder. Una función que recibe una **lambda con receptor** (`IsoSpecBuilder.() -> Unit`) permite llamar a los métodos del builder directamente dentro de las llaves:

```kotlin
class IsoSpecBuilder {
    private val fields = mutableMapOf<Int, FieldSpec>()

    fun numeric(number: Int, length: Int, name: String, type: LengthType = LengthType.FIXED) {
        fields[number] = FieldSpec(number, type, ContentType.NUMERIC, length, name)
    }

    fun alpha(number: Int, length: Int, name: String, type: LengthType = LengthType.FIXED) {
        fields[number] = FieldSpec(number, type, ContentType.ALPHANUMERIC, length, name)
    }

    fun build() = IsoSpec(fields.toMap())
}

fun isoSpec(block: IsoSpecBuilder.() -> Unit): IsoSpec = IsoSpecBuilder().apply(block).build()
```

Y la especificación queda como una tabla:

```kotlin
val BasicSpec = isoSpec {
    numeric(2, 19, "PAN", LengthType.LLVAR)
    numeric(3, 6, "Código de procesamiento")
    numeric(4, 12, "Monto")
    numeric(7, 10, "Fecha y hora de transmisión")
    numeric(11, 6, "STAN")
    alpha(37, 12, "RRN")
    alpha(38, 6, "Código de autorización")
    alpha(39, 2, "Código de respuesta")
    alpha(41, 8, "ID de terminal")
    numeric(49, 3, "Moneda")
    numeric(70, 3, "Código de gestión de red")
}
```

El parámetro por defecto `type = LengthType.FIXED` hace que solo los campos variables necesiten indicar su tipo, que es justo lo que destaca un documento de especificación.

## Mensajes inmutables

Para no recordar números mágicos, damos nombre a los campos más usados:

```kotlin
object Field {
    const val PAN = 2
    const val PROCESSING_CODE = 3
    const val AMOUNT = 4
    const val TRANSMISSION_DATE_TIME = 7
    const val STAN = 11
    const val RRN = 37
    const val AUTH_CODE = 38
    const val RESPONSE_CODE = 39
    const val TERMINAL_ID = 41
    const val CURRENCY = 49
    const val NETWORK_CODE = 70
}
```

El mensaje es una `data class` inmutable que valida sus datos en el bloque `init`, y un builder con `operator fun set` permite escribir `this[campo] = valor`:

```kotlin
data class IsoMessage(val mti: String, val fields: SortedMap<Int, String>) {
    init {
        require(mti.length == 4 && mti.all(Char::isDigit)) { "MTI inválido: $mti" }
        require(fields.keys.all { it in 2..128 }) { "Hay campos fuera del rango 2..128" }
    }

    operator fun get(field: Int): String? = fields[field]

    fun withChanges(mti: String = this.mti, block: IsoMessageBuilder.() -> Unit = {}): IsoMessage =
        IsoMessageBuilder(mti, fields).apply(block).build()
}

class IsoMessageBuilder(private val mti: String, initial: Map<Int, String> = emptyMap()) {
    private val fields = initial.toSortedMap()

    operator fun set(field: Int, value: String) {
        fields[field] = value
    }

    fun remove(field: Int) {
        fields.remove(field)
    }

    fun build() = IsoMessage(mti, fields)
}

fun isoMessage(mti: String, block: IsoMessageBuilder.() -> Unit): IsoMessage =
    IsoMessageBuilder(mti).apply(block).build()
```

Construir una compra ahora se ve así:

```kotlin
val compra = isoMessage("0200") {
    this[Field.PAN] = "4111111111111111"
    this[Field.PROCESSING_CODE] = "000000"
    this[Field.AMOUNT] = "000000015000"
    this[Field.TRANSMISSION_DATE_TIME] = "1123103000"
    this[Field.STAN] = "000123"
    this[Field.TERMINAL_ID] = "TERM0001"
    this[Field.CURRENCY] = "170"
}
```

`withChanges` es especialmente útil del lado del servidor o en pruebas: una respuesta se arma a partir de la solicitud cambiando el MTI y agregando o quitando campos, sin mutar el original.

## El bitmap con `LongArray`

Un `Long` tiene exactamente 64 bits, el tamaño de un bloque del bitmap. El primario es un `Long` y, si hay secundario, se añade otro. El campo `n` es el bit `63 - (n - 1) % 64` del `Long` correspondiente:

```kotlin
object Bitmap {
    fun encode(fields: Set<Int>): String {
        val words = LongArray(if (fields.any { it > 64 }) 2 else 1)
        if (words.size == 2) words.setBit(1)
        fields.forEach { words.setBit(it) }
        return words.joinToString("") { it.toULong().toString(16).padStart(16, '0').uppercase() }
    }

    fun decode(words: LongArray): List<Int> = (2..words.size * 64).filter { words.isSet(it) }

    fun LongArray.isSet(field: Int): Boolean {
        val i = field - 1
        return this[i / 64] and (1L shl (63 - i % 64)) != 0L
    }

    private fun LongArray.setBit(field: Int) {
        val i = field - 1
        this[i / 64] = this[i / 64] or (1L shl (63 - i % 64))
    }
}
```

El detalle que suele morder: un `Long` con el bit más alto encendido es **negativo**, y `toString(16)` lo imprimiría con signo (`-7de0...`). Convertirlo a `ULong` antes da la representación hexadecimal correcta. Al leer pasa lo mismo en sentido inverso: `"8220000000000000".toLong(16)` falla por desbordamiento, mientras que `toULong(16).toLong()` funciona.

## Empaquetar y desempaquetar

Con `buildString`, `when` como expresión y `padStart`/`padEnd`, el empaquetador se reduce bastante:

```kotlin
class IsoPacker(private val spec: IsoSpec) {

    fun pack(message: IsoMessage): ByteArray = buildString {
        append(message.mti)
        append(Bitmap.encode(message.fields.keys))
        message.fields.forEach { (number, value) -> append(packField(spec[number], value)) }
    }.toByteArray(Charsets.US_ASCII)

    private fun packField(field: FieldSpec, value: String): String {
        require(value.length <= field.maxLength) { "Campo ${field.number} excede ${field.maxLength} caracteres" }
        if (field.content == ContentType.NUMERIC) {
            require(value.all(Char::isDigit)) { "Campo ${field.number} debe ser numérico" }
        }
        return when (field.lengthType) {
            LengthType.FIXED -> when (field.content) {
                ContentType.NUMERIC -> value.padStart(field.maxLength, '0')
                ContentType.ALPHANUMERIC -> value.padEnd(field.maxLength, ' ')
            }
            LengthType.LLVAR, LengthType.LLLVAR ->
                value.length.toString().padStart(field.lengthType.prefixDigits, '0') + value
        }
    }

    fun unpack(data: ByteArray): IsoMessage {
        val cursor = Cursor(data.toString(Charsets.US_ASCII))
        val mti = cursor.take(4)

        var bitmap = longArrayOf(cursor.takeHexWord())
        with(Bitmap) {
            if (bitmap.isSet(1)) bitmap += cursor.takeHexWord()
        }

        val message = isoMessage(mti) {
            for (number in Bitmap.decode(bitmap)) {
                val field = spec[number]
                val length = when (field.lengthType) {
                    LengthType.FIXED -> field.maxLength
                    else -> cursor.take(field.lengthType.prefixDigits).toInt()
                }
                this[number] = cursor.take(length)
            }
        }
        check(cursor.remaining == 0) { "Sobran ${cursor.remaining} bytes al final del mensaje" }
        return message
    }

    private class Cursor(private val data: String) {
        private var position = 0
        val remaining get() = data.length - position

        fun take(count: Int): String {
            check(position + count <= data.length) { "Mensaje truncado en la posición $position" }
            return data.substring(position, position + count).also { position += count }
        }

        fun takeHexWord(): Long = take(16).toULong(16).toLong()
    }
}
```

Algunos detalles de Kotlin que vale la pena notar:

- `require` lanza `IllegalArgumentException` (el dato de entrada es inválido) y `check` lanza `IllegalStateException` (el estado del proceso es inválido). Usarlos bien hace que los errores se expliquen solos.
- `with(Bitmap) { ... }` pone en alcance la extensión `isSet`, que está declarada dentro del objeto.
- `bitmap += ...` sobre un `LongArray` crea un arreglo nuevo con el elemento añadido; por eso `bitmap` es `var`.
- El `when` sobre un `enum` es exhaustivo: si mañana agregas `LLLLVAR`, el compilador te obliga a manejarlo.

La salida es idéntica byte a byte a la de Java, lo que es una buena prueba de que ambas implementaciones son equivalentes:

```text
020072200000008080001641111111111111110000000000000150001123103000000123TERM0001170
```

## Codificación BCD

Hasta ahora todo viaja en ASCII: cada dígito ocupa un byte. Muchas especificaciones, sobre todo las de terminales, usan **BCD** (*Binary Coded Decimal*): cada dígito ocupa medio byte (4 bits), así que caben dos dígitos por byte.

| Valor | ASCII | BCD |
| ----- | ----- | --- |
| `0200` | `30 32 30 30` (4 bytes) | `02 00` (2 bytes) |
| `000000015000` | 12 bytes | `00 00 00 01 50 00` (6 bytes) |
| `170` | `31 37 30` (3 bytes) | `01 70` (2 bytes, con un 0 de relleno a la izquierda) |

Dos funciones de extensión bastan para convertir:

```kotlin
fun String.toBcd(): ByteArray {
    require(all(Char::isDigit)) { "BCD solo admite dígitos: $this" }
    val digits = if (length % 2 == 0) this else "0$this"
    return ByteArray(digits.length / 2) { i ->
        ((digits[2 * i].digitToInt() shl 4) or digits[2 * i + 1].digitToInt()).toByte()
    }
}

fun ByteArray.fromBcd(digits: Int): String =
    joinToString("") { "%02X".format(it) }.takeLast(digits)
```

`toBcd` pone el primer dígito en los 4 bits altos y el segundo en los 4 bajos. `fromBcd` aprovecha que la representación hexadecimal de un byte BCD **son** sus dos dígitos, y descarta el relleno con `takeLast`.

Con BCD en el MTI, los campos numéricos y los prefijos de longitud, y el bitmap en binario (8 bytes en lugar de 16 caracteres), la misma compra pasa de 83 a 46 bytes:

```text
02 00 72 20 00 00 00 80 80 00 16 41 11 11 11 11 11 11 11 00 00 00 00 00 00 01 50 00
11 23 10 30 00 00 01 23 54 45 52 4D 30 30 30 31 01 70
```

Fíjate en `54 45 52 4D 30 30 30 31`: el campo 41 es alfanumérico, así que sigue en ASCII (`TERM0001`). Para soportar BCD en el empaquetador, la forma limpia es añadir a `FieldSpec` una propiedad `encoding` (ASCII, BCD, BINARY) y que `packField` y `unpack` trabajen sobre `ByteArray` en lugar de `String`. La estructura del código no cambia; solo cambia cómo se escribe y se lee cada pieza.

## Códigos de respuesta con tipos

En lugar de comparar `"00"` por todas partes, un `enum` y una propiedad de extensión hacen el código del cliente más expresivo:

```kotlin
enum class ResponseCode(val code: String, val description: String) {
    APPROVED("00", "Aprobada"),
    DO_NOT_HONOR("05", "No aprobada"),
    INSUFFICIENT_FUNDS("51", "Fondos insuficientes"),
    EXPIRED_CARD("54", "Tarjeta vencida"),
    INCORRECT_PIN("55", "PIN incorrecto"),
    ISSUER_UNAVAILABLE("91", "Emisor no disponible"),
    SYSTEM_ERROR("96", "Error del sistema");

    companion object {
        fun from(code: String?): ResponseCode? = entries.firstOrNull { it.code == code }
    }
}

val IsoMessage.responseCode: ResponseCode?
    get() = ResponseCode.from(this[Field.RESPONSE_CODE])

fun IsoMessage.isResponseTo(request: IsoMessage): Boolean =
    mti.toInt() == request.mti.toInt() + 10 && this[Field.STAN] == request[Field.STAN]
```

`isResponseTo` aplica las dos reglas de la parte 1: la respuesta tiene el MTI de la solicitud más 10 y el mismo STAN.

## Un caso real: cliente con coroutines

En Android no puedes hacer red en el hilo principal. Con una función `suspend` y `withContext(Dispatchers.IO)` el socket bloqueante se ejecuta en un hilo de E/S y quien llama solo ve una función que "espera" la respuesta:

```kotlin
class IsoClient(
    private val host: String,
    private val port: Int,
    private val packer: IsoPacker,
    private val timeoutMillis: Int = 30_000,
) {
    suspend fun send(request: IsoMessage): IsoMessage = withContext(Dispatchers.IO) {
        Socket().use { socket ->
            socket.connect(InetSocketAddress(host, port), timeoutMillis)
            socket.soTimeout = timeoutMillis

            val output = DataOutputStream(socket.getOutputStream().buffered())
            val input = DataInputStream(socket.getInputStream().buffered())

            val bytes = packer.pack(request)
            output.writeShort(bytes.size)
            output.write(bytes)
            output.flush()

            val response = ByteArray(input.readUnsignedShort())
            input.readFully(response)

            packer.unpack(response).also {
                check(it.isResponseTo(request)) { "La respuesta no corresponde a la solicitud" }
            }
        }
    }
}
```

Desde un `ViewModel`:

```kotlin
viewModelScope.launch {
    val respuesta = client.send(compra)
    _estado.value = when (val code = respuesta.responseCode) {
        ResponseCode.APPROVED -> Estado.Aprobada(respuesta[Field.AUTH_CODE].orEmpty())
        null -> Estado.Rechazada("Código desconocido: ${respuesta[Field.RESPONSE_CODE]}")
        else -> Estado.Rechazada(code.description)
    }
}
```

El timeout se controla con `soTimeout` y no con `withTimeout` de coroutines: una lectura bloqueante de un socket no responde a la cancelación de la coroutine, pero sí lanza `SocketTimeoutException` cuando vence `soTimeout`.

### El timeout no es un rechazo

Este es el punto que más problemas causa en producción. Si la solicitud salió pero la respuesta no llegó, **no sabes si el emisor aprobó la compra**. Puede que el cliente no reciba el producto y aun así se le descuente el dinero. Por eso, ante un timeout en un `0200`, el adquirente envía un **reverso** (`0400`) para deshacer la transacción si llegó a aprobarse:

```kotlin
suspend fun IsoClient.sendWithReversal(request: IsoMessage): IsoMessage =
    try {
        send(request)
    } catch (e: SocketTimeoutException) {
        val reversal = request.withChanges(mti = "0400")
        runCatching { send(reversal) }
            .onFailure { /* guardarlo para reintentar más tarde (store and forward) */ }
        throw e
    }
```

En una integración real el reverso suele llevar campos adicionales, como el 90 (datos del mensaje original), y debe reintentarse hasta que el procesador lo confirme. Los detalles dependen de la especificación, pero la regla es universal: **un timeout siempre se reversa**.

## Pruebas unitarias

Al ser una lógica pura (bytes que entran, objetos que salen), el empaquetador es muy fácil de probar. Estas tres pruebas cubren los errores que más se ven:

```kotlin
class IsoPackerTest {
    private val packer = IsoPacker(BasicSpec)

    @Test
    fun `empaqueta y desempaqueta sin perder datos`() {
        assertEquals(compra, packer.unpack(packer.pack(compra)))
    }

    @Test
    fun `el campo 70 activa el bitmap secundario`() {
        val echo = isoMessage("0800") {
            this[Field.TRANSMISSION_DATE_TIME] = "1123103000"
            this[Field.STAN] = "000001"
            this[Field.NETWORK_CODE] = "301"
        }
        val raw = packer.pack(echo).toString(Charsets.US_ASCII)

        assertEquals("8220000000000000", raw.substring(4, 20))
        assertEquals("0400000000000000", raw.substring(20, 36))
    }

    @Test
    fun `rechaza un monto con letras`() {
        val mensaje = isoMessage("0200") { this[Field.AMOUNT] = "15O00" }
        assertFailsWith<IllegalArgumentException> { packer.pack(mensaje) }
    }
}
```

La primera prueba compara dos `data class`, así que verifica MTI y todos los campos de una vez. Funciona porque en `compra` los valores ya vienen con su relleno; si pasaras `"15000"` en el monto, el mensaje desempaquetado traería `"000000015000"` y no serían iguales. La tercera atrapa un error real: una `O` mayúscula en lugar de un cero.

## Errores comunes

- **Imprimir un `Long` negativo como hexadecimal.** Convierte a `ULong` antes de llamar a `toString(16)`.
- **Usar `withTimeout` para cortar una lectura de socket.** No funciona con E/S bloqueante; usa `soTimeout`.
- **Tratar un timeout como un rechazo.** Siempre envía el reverso.
- **Olvidar el dígito de relleno en BCD.** Un valor de longitud impar necesita un 0 a la izquierda, y al leer hay que descartarlo.
- **Hacer red en el hilo principal.** En Android lanza `NetworkOnMainThreadException`; usa `Dispatchers.IO`.

## Resumen

- Los DSL con lambdas con receptor hacen que especificaciones y mensajes se lean como el documento del procesador.
- Una `data class` inmutable con `withChanges` simplifica construir respuestas y reversos.
- El bitmap encaja de forma natural en un `LongArray`, siempre que se trate como sin signo.
- BCD guarda dos dígitos por byte y reduce casi a la mitad el tamaño del mensaje.
- Con `suspend` y `Dispatchers.IO` el cliente se integra con Android sin bloquear la interfaz, pero el timeout lo maneja el socket y siempre se reversa.

## Para practicar

1. Añade `encoding` a `FieldSpec` y haz que `IsoPacker` produzca los 46 bytes en BCD del ejemplo.
2. Escribe una función `IsoMessage.masked()` que oculte el PAN y úsala en un `toString` seguro para logs.
3. Implementa un servidor de prueba con `ServerSocket` que responda `0210` con código `51` a cualquier monto mayor a 100.000, y pruébalo con `IsoClient`.

Con esto cerramos la serie: ya puedes leer un mensaje ISO 8583 a mano, implementarlo en Java y llevarlo a una integración en Kotlin.
