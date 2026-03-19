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

## Formato de alerta (OBLIGATORIO)

Cuando el estado de una cuenta **cambie**, Maria debe enviar una alerta con este formato exacto:

```
🚨 Alerta Meta Ads

Cuenta: {nombre_cuenta}
Estado anterior: {estado_anterior} ({codigo_anterior})
Estado nuevo: {estado_nuevo} ({codigo_nuevo})
Razón: {razón si está disponible, sino "Sin razón especificada"}

Acción: {acción recomendada según la tabla de códigos}
```

### Reglas del formato:
1. **NO incluir gasto acumulado** — esta métrica no es relevante para alertas de estado y puede confundir al cliente
2. **NO incluir `amount_spent`** ni ningún dato financiero en las alertas de estado
3. Solo alertar cuando el estado CAMBIE (no repetir la misma alerta)
4. Si el estado vuelve a 1 (Activa), enviar alerta positiva con este formato exacto (sin estado anterior, sin gasto):

```
✅ Cuenta reactivada

Cuenta: {nombre_cuenta}
Estado: Activa

La cuenta fue reactivada exitosamente. Tus campañas de anuncios correran normalmente.
```

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
