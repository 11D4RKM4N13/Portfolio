---
title: 'ISO 8583 en la práctica: empaquetador y parser en Java'
description: Implementa desde cero en Java un empaquetador y un parser ISO 8583 con bitmap primario y secundario, campos fijos y variables, y envío por TCP.
date: 2026-11-23
tags: [ISO 8583, Pagos, Java]
level: intermediate
series: ISO 8583 en la práctica
seriesOrder: 2
draft: false
---

En la parte anterior vimos que un mensaje ISO 8583 es un MTI, un bitmap y una serie de campos sin separadores. Leerlo a mano sirve para entenderlo, pero en un sistema real necesitas código que haga dos cosas sin equivocarse: **empaquetar** (pasar de un objeto a bytes) y **desempaquetar** (pasar de bytes a un objeto).

En esta parte lo construimos en Java, sin librerías externas, para que cada decisión quede a la vista. Al final verás cuándo conviene usar una librería como jPOS en lugar de mantener tu propia implementación.

## Qué vas a aprender

- Cómo modelar la especificación de campos separada del mensaje.
- Cómo calcular y leer el bitmap primario y secundario con operaciones de bits.
- Cómo empaquetar campos fijos, LLVAR y LLLVAR, y cómo validar los datos.
- Cómo enviar y recibir mensajes por TCP con cabecera de longitud.

Usaremos Java 17 o superior (records, `switch` como expresión y `HexFormat`).

## El diseño

La idea clave es **separar el mensaje de la especificación**. El mensaje solo sabe qué valores tiene; la especificación sabe cómo se codifica cada campo. Así, si mañana te integras con otro procesador, cambias la especificación y no tocas el resto.

| Clase | Responsabilidad |
| ----- | --------------- |
| `FieldSpec` | Describe un campo: número, tipo de longitud, contenido y longitud máxima |
| `IsoSpec` | Conjunto de campos que usa una red o procesador |
| `IsoMessage` | MTI y valores de los campos |
| `Bitmap` | Calcula y lee el bitmap |
| `IsoPacker` | Convierte un `IsoMessage` a bytes y viceversa usando una `IsoSpec` |
| `IsoChannel` | Envía y recibe mensajes por TCP |

Para mantener el ejemplo legible, todo el mensaje se codifica en **ASCII** con el bitmap en hexadecimal. En la parte 3 veremos cómo cambia esto con BCD y binario.

## La especificación de campos

```java
public enum LengthType {
    FIXED(0), LLVAR(2), LLLVAR(3);

    final int prefixDigits;

    LengthType(int prefixDigits) {
        this.prefixDigits = prefixDigits;
    }
}

public enum ContentType { NUMERIC, ALPHANUMERIC }

public record FieldSpec(int number, LengthType lengthType, ContentType content, int maxLength, String name) {}
```

`prefixDigits` dice cuántos dígitos ocupa el prefijo de longitud: ninguno en un campo fijo, 2 en LLVAR y 3 en LLLVAR. Guardarlo en el enum evita un `if` por cada tipo más adelante.

La especificación es un mapa de número de campo a `FieldSpec`, con un método `field` encadenable para que definirla se lea casi como la tabla del documento del procesador:

```java
public final class IsoSpec {
    private final Map<Integer, FieldSpec> fields = new HashMap<>();

    public IsoSpec field(int number, LengthType type, ContentType content, int maxLength, String name) {
        fields.put(number, new FieldSpec(number, type, content, maxLength, name));
        return this;
    }

    public FieldSpec get(int number) {
        FieldSpec spec = fields.get(number);
        if (spec == null) {
            throw new IllegalArgumentException("Campo " + number + " no definido en la especificación");
        }
        return spec;
    }

    public static IsoSpec basic() {
        return new IsoSpec()
            .field(2,  LengthType.LLVAR, ContentType.NUMERIC,      19, "PAN")
            .field(3,  LengthType.FIXED, ContentType.NUMERIC,       6, "Código de procesamiento")
            .field(4,  LengthType.FIXED, ContentType.NUMERIC,      12, "Monto")
            .field(7,  LengthType.FIXED, ContentType.NUMERIC,      10, "Fecha y hora de transmisión")
            .field(11, LengthType.FIXED, ContentType.NUMERIC,       6, "STAN")
            .field(37, LengthType.FIXED, ContentType.ALPHANUMERIC, 12, "RRN")
            .field(38, LengthType.FIXED, ContentType.ALPHANUMERIC,  6, "Código de autorización")
            .field(39, LengthType.FIXED, ContentType.ALPHANUMERIC,  2, "Código de respuesta")
            .field(41, LengthType.FIXED, ContentType.ALPHANUMERIC,  8, "ID de terminal")
            .field(49, LengthType.FIXED, ContentType.NUMERIC,       3, "Moneda")
            .field(70, LengthType.FIXED, ContentType.NUMERIC,       3, "Código de gestión de red");
    }
}
```

Lanzar una excepción ante un campo desconocido es intencional: si llega un mensaje con un campo que no está en tu especificación, no hay forma de saber cuántos bytes ocupa y el resto del mensaje quedaría desalineado. Es mejor fallar de inmediato.

## El mensaje

```java
public final class IsoMessage {
    private String mti;
    private final SortedMap<Integer, String> fields = new TreeMap<>();

    public IsoMessage(String mti) {
        setMti(mti);
    }

    public String getMti() { return mti; }

    public void setMti(String mti) {
        if (mti == null || !mti.matches("\\d{4}")) {
            throw new IllegalArgumentException("MTI inválido: " + mti);
        }
        this.mti = mti;
    }

    public IsoMessage set(int field, String value) {
        if (field < 2 || field > 128) {
            throw new IllegalArgumentException("Campo fuera de rango: " + field);
        }
        fields.put(field, value);
        return this;
    }

    public String get(int field) { return fields.get(field); }

    public boolean has(int field) { return fields.containsKey(field); }

    public SortedMap<Integer, String> fields() {
        return Collections.unmodifiableSortedMap(fields);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("MTI ").append(mti);
        fields.forEach((k, v) -> sb.append(String.format("%n  [%03d] %s", k, v)));
        return sb.toString();
    }
}
```

Dos detalles importantes:

- Usamos un `TreeMap` porque **los campos deben escribirse en orden ascendente**. Con un `HashMap` el orden dependería de los hashes y el mensaje saldría corrupto.
- El campo 1 no se puede asignar a mano: es el indicador de bitmap secundario y lo calcula el empaquetador.

## El bitmap

Aquí está la parte más delicada. El campo `n` corresponde al bit `n - 1` contando desde 0, y dentro de cada byte el primer bit es el **más significativo** (`0x80`):

```java
public final class Bitmap {
    private Bitmap() {}

    public static String encode(Set<Integer> fieldNumbers) {
        boolean secondary = fieldNumbers.stream().anyMatch(f -> f > 64);
        byte[] bits = new byte[secondary ? 16 : 8];
        if (secondary) setBit(bits, 1);
        for (int field : fieldNumbers) setBit(bits, field);
        return HexFormat.of().withUpperCase().formatHex(bits);
    }

    public static List<Integer> decode(byte[] bits) {
        List<Integer> fields = new ArrayList<>();
        for (int field = 2; field <= bits.length * 8; field++) {
            if (isSet(bits, field)) fields.add(field);
        }
        return fields;
    }

    public static boolean isSet(byte[] bits, int field) {
        int index = field - 1;
        return (bits[index / 8] & (0x80 >>> (index % 8))) != 0;
    }

    private static void setBit(byte[] bits, int field) {
        int index = field - 1;
        bits[index / 8] |= (byte) (0x80 >>> (index % 8));
    }
}
```

Con el campo 11, por ejemplo: `index = 10`, el byte es `10 / 8 = 1` (el segundo) y la máscara es `0x80 >>> 2 = 0x20`. Exactamente el `20` que calculamos a mano en la parte 1.

`decode` empieza en el campo 2 porque el bit 1 no es un campo con datos; solo indica que hay un segundo bloque de 64 bits.

## Empaquetar

El empaquetador escribe el MTI, el bitmap y cada campo según su especificación:

```java
public final class IsoPacker {
    private final IsoSpec spec;

    public IsoPacker(IsoSpec spec) {
        this.spec = spec;
    }

    public byte[] pack(IsoMessage message) {
        StringBuilder out = new StringBuilder();
        out.append(message.getMti());
        out.append(Bitmap.encode(message.fields().keySet()));
        message.fields().forEach((number, value) -> out.append(packField(spec.get(number), value)));
        return out.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private String packField(FieldSpec spec, String value) {
        if (value.length() > spec.maxLength()) {
            throw new IllegalArgumentException(
                "Campo " + spec.number() + " excede " + spec.maxLength() + " caracteres");
        }
        if (spec.content() == ContentType.NUMERIC && !value.chars().allMatch(Character::isDigit)) {
            throw new IllegalArgumentException("Campo " + spec.number() + " debe ser numérico");
        }
        return switch (spec.lengthType()) {
            case FIXED -> pad(spec, value);
            case LLVAR, LLLVAR -> {
                String length = String.format("%0" + spec.lengthType().prefixDigits + "d", value.length());
                yield length + value;
            }
        };
    }

    private String pad(FieldSpec spec, String value) {
        int missing = spec.maxLength() - value.length();
        return spec.content() == ContentType.NUMERIC
            ? "0".repeat(missing) + value
            : value + " ".repeat(missing);
    }

    // unpack(...) en la siguiente sección
}
```

Las validaciones no son decoración. Un monto de 13 dígitos en un campo `n12` no da error en el procesador: simplemente corre todos los campos siguientes un carácter y obtienes un rechazo genérico (`30`, error de formato) o, peor, un campo mal interpretado. Validar al empaquetar te da un mensaje de error claro en tu lado.

## Desempaquetar

Para leer necesitamos avanzar por el mensaje consumiendo bytes. Un pequeño cursor lo hace explícito y detecta mensajes truncados:

```java
private static final class Cursor {
    private final String data;
    private int position = 0;

    Cursor(String data) {
        this.data = data;
    }

    String take(int count) {
        if (position + count > data.length()) {
            throw new IllegalStateException("Mensaje truncado en la posición " + position);
        }
        String chunk = data.substring(position, position + count);
        position += count;
        return chunk;
    }

    int remaining() {
        return data.length() - position;
    }
}
```

Y con él, el método `unpack` de `IsoPacker`:

```java
public IsoMessage unpack(byte[] data) {
    Cursor cursor = new Cursor(new String(data, StandardCharsets.US_ASCII));

    IsoMessage message = new IsoMessage(cursor.take(4));

    byte[] bitmap = HexFormat.of().parseHex(cursor.take(16));
    if (Bitmap.isSet(bitmap, 1)) {
        byte[] full = Arrays.copyOf(bitmap, 16);
        System.arraycopy(HexFormat.of().parseHex(cursor.take(16)), 0, full, 8, 8);
        bitmap = full;
    }

    for (int number : Bitmap.decode(bitmap)) {
        FieldSpec field = spec.get(number);
        int length = switch (field.lengthType()) {
            case FIXED -> field.maxLength();
            case LLVAR, LLLVAR -> Integer.parseInt(cursor.take(field.lengthType().prefixDigits));
        };
        message.set(number, cursor.take(length));
    }

    if (cursor.remaining() > 0) {
        throw new IllegalStateException("Sobran " + cursor.remaining() + " bytes al final del mensaje");
    }
    return message;
}
```

El orden de lectura es el mismo que el de escritura: MTI, bitmap primario, bitmap secundario si el bit 1 está encendido, y luego cada campo. La comprobación final de bytes sobrantes es una red de seguridad muy útil: si tu especificación tiene mal la longitud de un campo, casi siempre lo descubrirás aquí.

## Probándolo

```java
IsoPacker packer = new IsoPacker(IsoSpec.basic());

IsoMessage purchase = new IsoMessage("0200")
    .set(2, "4111111111111111")
    .set(3, "000000")
    .set(4, "15000")
    .set(7, "1123103000")
    .set(11, "123")
    .set(41, "TERM0001")
    .set(49, "170");

byte[] packed = packer.pack(purchase);
System.out.println(new String(packed, StandardCharsets.US_ASCII));
System.out.println(packer.unpack(packed));
```

Salida:

```text
020072200000008080001641111111111111110000000000000150001123103000000123TERM0001170
MTI 0200
  [002] 4111111111111111
  [003] 000000
  [004] 000000015000
  [007] 1123103000
  [011] 000123
  [041] TERM0001
  [049] 170
```

Es exactamente el mensaje que decodificamos a mano en la parte 1. Observa que pasamos `"15000"` y `"123"` y el empaquetador los rellenó con ceros hasta `n12` y `n6`.

Con el eco de red (campos 7, 11 y 70) el bitmap secundario aparece solo:

```java
IsoMessage echo = new IsoMessage("0800")
    .set(7, "1123103000")
    .set(11, "1")
    .set(70, "301");
// 0800822000000000000004000000000000001123103000000001301
```

## Un caso real: enviarlo por TCP

Los procesadores reciben los mensajes por un socket TCP. Como TCP es un flujo de bytes y no de mensajes, cada mensaje va precedido por su longitud. Lo más común es una **cabecera de 2 bytes en binario big-endian**, que es justo lo que hacen `DataOutputStream.writeShort` y `DataInputStream.readUnsignedShort`:

```java
public final class IsoChannel implements Closeable {
    private final Socket socket;
    private final DataInputStream in;
    private final DataOutputStream out;

    public IsoChannel(String host, int port, int timeoutMillis) throws IOException {
        socket = new Socket();
        socket.connect(new InetSocketAddress(host, port), timeoutMillis);
        socket.setSoTimeout(timeoutMillis);
        in = new DataInputStream(new BufferedInputStream(socket.getInputStream()));
        out = new DataOutputStream(new BufferedOutputStream(socket.getOutputStream()));
    }

    public void send(byte[] message) throws IOException {
        if (message.length > 0xFFFF) {
            throw new IllegalArgumentException("Mensaje demasiado grande");
        }
        out.writeShort(message.length);
        out.write(message);
        out.flush();
    }

    public byte[] receive() throws IOException {
        int length = in.readUnsignedShort();
        byte[] message = new byte[length];
        in.readFully(message);
        return message;
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }
}
```

Usarlo queda así:

```java
try (IsoChannel channel = new IsoChannel("10.0.0.5", 9000, 30_000)) {
    channel.send(packer.pack(purchase));
    IsoMessage response = packer.unpack(channel.receive());

    if ("00".equals(response.get(39))) {
        System.out.println("Aprobada: " + response.get(38));
    } else {
        System.out.println("Rechazada con código " + response.get(39));
    }
}
```

`readFully` es importante: un `read` normal puede devolver menos bytes de los pedidos si el mensaje llega partido en varios segmentos TCP. `readFully` sigue leyendo hasta completar la longitud indicada.

Algunas redes usan otra cabecera: 4 dígitos ASCII (`"0083"`), o un **TPDU** de 5 bytes entre la longitud y el MTI. Siempre revisa esa parte en la especificación antes de culpar al parser.

## ¿Y jPOS?

[jPOS](https://jpos.org/) es la librería de referencia para ISO 8583 en Java. Trae empaquetadores para decenas de codificaciones, definiciones de especificación en XML, canales con distintos tipos de cabecera, multiplexores para enviar varias transacciones por la misma conexión y un servidor listo para producción.

Implementarlo desde cero, como hicimos aquí, tiene sentido para aprender, para una integración pequeña y bien acotada, o en entornos donde no puedes añadir dependencias pesadas (por ejemplo, una librería embebida en un terminal Android). Para un switch transaccional o un adquirente, jPOS te ahorra años de casos borde.

## Errores comunes

- **Usar `HashMap` para los campos.** El orden de escritura debe ser ascendente; usa `TreeMap`.
- **Construir el `String` con el charset por defecto.** Usa siempre `StandardCharsets.US_ASCII` (o el que diga la especificación). El charset por defecto depende del sistema.
- **Usar `read` en lugar de `readFully`.** Funciona en local y falla en producción cuando la red parte el mensaje.
- **Imprimir el mensaje completo en los logs.** Enmascara el PAN (por ejemplo, `411111******1111`) antes de registrar cualquier cosa.
- **No poner timeout al socket.** Sin `setSoTimeout`, una respuesta que nunca llega bloquea el hilo para siempre.

## Resumen

- Separar `IsoSpec` de `IsoMessage` permite soportar varias redes con el mismo código.
- El bitmap se calcula con `0x80 >>> (index % 8)` sobre el byte `index / 8`, donde `index = campo - 1`.
- Empaquetar y desempaquetar siguen el mismo orden: MTI, bitmap, campos ascendentes.
- Por TCP, cada mensaje va con una cabecera de longitud; `readFully` garantiza leerlo completo.

## Para practicar

1. Agrega el campo 55 (datos EMV) como `LLLVAR` alfanumérico de hasta 999 caracteres y prueba un mensaje que lo incluya.
2. Implementa un método `IsoMessage masked()` que devuelva una copia con el PAN enmascarado para usarla en los logs.
3. Desempaqueta el mensaje de práctica de la parte 1 y comprueba tu respuesta.

En la parte 3 llevamos esta implementación a Kotlin: un DSL para construir mensajes, codificación BCD y un cliente con coroutines.
