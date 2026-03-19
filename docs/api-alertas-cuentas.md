# API Alertas de Estado de Cuentas - Integración con Bot Maria

## Endpoint

```
GET https://metasuite.dtgrowthpartners.com/api/ad-accounts?accessToken={TOKEN}
```

## Autenticación

El endpoint requiere un **Meta Access Token** válido.

```
?accessToken={TOKEN}
```

## Respuesta

Devuelve todas las cuentas publicitarias accesibles con su estado actual:

```json
{
  "success": true,
  "accounts": [
    {
      "id": "act_1116031925283339",
      "name": "Innovación — E-commerce",
      "account_status": 1,
      "business": { "id": "123456", "name": "Innovación Fashion" }
    }
  ]
}
```

## Códigos de estado (`account_status`)

| Código | Estado | Acción |
|--------|--------|--------|
| 1 | Activa | Ninguna — todo bien ✅ |
| 2 | Deshabilitada | Revisar políticas de Meta |
| 3 | No liquidada (pago pendiente) | Revisar método de pago en Meta Business Suite |
| 7 | Pendiente de revisión | Esperar revisión de Meta |
| 8 | En período de gracia | Pagar antes de que se deshabilite |
| 9 | Pausada temporalmente | Reactivar en configuración |
| 100 | Cerrada | No se puede reactivar |
| 101 | Cualquier estado desconocido | Verificar en Meta Business Suite |

## Plantilla: Alerta de pago rechazado (OBLIGATORIO)

Cuando el estado cambie a **3 (pago pendiente)** o similar, Maria debe enviar este mensaje exacto:

```
Hola {nombre_cliente},

⚠️ Alerta de Publicidad

Cuenta: {nombre_cuenta}
Estado: Pausada por fallo de pago
💰 Monto pendiente: ${monto} {moneda}

El método de pago fue rechazado. Tus campañas están detenidas y no se muestran anuncios.

🔹 ¿Qué hacer?
Recarga o actualiza tu método de pago por un valor mínimo de ${monto} para reactivar tus campañas.

⏳ Mientras no se resuelva, estás perdiendo visibilidad, clientes y ventas.

¿Dudas o necesitas ayuda? Contacta a Dairo: +573007189383
— Equipo DT Growth Partners
```

### Variables:
- `{nombre_cliente}`: nombre del cliente/dueño de la cuenta
- `{nombre_cuenta}`: nombre de la cuenta publicitaria
- `{monto}`: monto pendiente de pago (si está disponible en la API, sino omitir la línea de monto)
- `{moneda}`: moneda de la cuenta (COP, USD, etc.)

## Plantilla: Cuenta reactivada (OBLIGATORIO)

Cuando el estado vuelva a **1 (Activa)**, Maria debe enviar este mensaje exacto:

```
Hola {nombre_cliente},

✅ Tu cuenta publicitaria está activa nuevamente

Cuenta: {nombre_cuenta}
💰 Pago procesado: ${monto} {moneda}

Tus campañas ya están corriendo con normalidad. Tus anuncios se están mostrando nuevamente.

⚡ Recuerda mantener tu método de pago al día para evitar pausas que reinicien el aprendizaje de tus campañas y afecten su rendimiento.

Gracias por resolver el pago rápidamente 🙌

— Equipo DT Growth Partners
```

### Reglas generales:
1. **NO incluir códigos numéricos** de estado — nunca poner "(1)", "(3)", etc.
2. **NO incluir `amount_spent`** (gasto acumulado) — solo mostrar el monto pendiente si aplica
3. Solo alertar cuando el estado **CAMBIE** (no repetir la misma alerta)
4. Si no se tiene el monto pendiente, omitir la línea de "💰 Monto pendiente" o "💰 Pago procesado"
5. Si no se tiene el nombre del cliente, omitir "Hola {nombre_cliente}," y empezar directo con la alerta

## Lógica de monitoreo

1. Consultar el endpoint cada **15 minutos**
2. Comparar el `account_status` actual con el último conocido
3. Si cambió → enviar alerta
4. Si no cambió → no hacer nada
5. Guardar el estado actual para la próxima comparación

## Frecuencia

- **Monitoreo:** cada 15 minutos, de lunes a lunes (sin descanso)
- **Alertas:** solo cuando hay cambio de estado
- **Destinatarios:** Edgardo y quien corresponda según la cuenta

## Notas

- Los estados pueden cambiar en cualquier momento (Meta puede pausar/deshabilitar cuentas por pagos, políticas, etc.)
- El estado 3 (pago pendiente) es el más común — generalmente se resuelve actualizando el método de pago
- El estado 2 (deshabilitada) requiere apelación en Meta Business Suite
