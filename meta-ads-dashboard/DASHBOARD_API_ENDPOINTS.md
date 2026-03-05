# API Endpoints para Monitoreo de Cuentas Publicitarias (Meta)

## Endpoint principal

```
GET https://graph.facebook.com/v24.0/me/adaccounts
```

**Headers / Params:**
```
access_token: {TOKEN_DE_META}
fields: id,name,account_status,disable_reason,currency,amount_spent,business{id,name}
limit: 100
```

**Respuesta ejemplo:**
```json
{
  "data": [
    {
      "id": "act_1604918750004319",
      "name": "Equilibrio Clinic",
      "account_status": 1,
      "disable_reason": 0,
      "currency": "COP",
      "amount_spent": "1234567",
      "business": {
        "id": "117129001381950",
        "name": "Equilibrio Clinic"
      }
    }
  ]
}
```

---

## Valores de `account_status`

| Valor | Estado | Accion |
|-------|--------|--------|
| **1** | Activa | Todo bien, no alertar |
| **2** | Deshabilitada | ALERTAR - cuenta deshabilitada |
| **3** | Sin liquidar (pago pendiente) | ALERTAR - problema de pago |
| **7** | Revision de riesgo pendiente | ALERTAR - en revision |
| **8** | Liquidacion pendiente | ALERTAR - pago en proceso |
| **9** | En periodo de gracia | ALERTAR - pago proximo a vencer |
| **100** | Cierre pendiente | ALERTAR - cuenta por cerrar |
| **101** | Cerrada | ALERTAR - cuenta cerrada |

**Regla simple para el bot:** Si `account_status` es diferente de `1`, hay un problema.

---

## Valores de `disable_reason`

| Valor | Razon |
|-------|-------|
| **0** | Ninguno (todo bien) |
| **1** | Politica de integridad de anuncios |
| **2** | Revision IP de anuncios |
| **3** | Riesgo de pago |
| **4** | Cuenta gris cerrada |
| **5** | Revision AFC de anuncios |
| **6** | Integridad de negocio RAR |
| **7** | Cierre permanente |
| **8** | Cuenta de revendedor sin uso |
| **9** | Cuenta sin uso |

---

## Logica recomendada para el bot Maria

```
Cada X minutos (ej: cada 30 min o cada hora):

1. Llamar GET /me/adaccounts con los fields de arriba
2. Para cada cuenta:
   - Si account_status != 1 → hay problema
   - Si account_status == 3 → "Cuenta {nombre} tiene PAGO PENDIENTE"
   - Si account_status == 9 → "Cuenta {nombre} esta en PERIODO DE GRACIA"
   - Si account_status == 2 → "Cuenta {nombre} fue DESHABILITADA"
     - Si disable_reason == 3 → "por RIESGO DE PAGO"
     - Si disable_reason == 1 → "por POLITICA DE INTEGRIDAD"
   - Si account_status == 101 → "Cuenta {nombre} fue CERRADA"
3. Comparar con el estado anterior para solo alertar cuando CAMBIE
   (no repetir la misma alerta cada vez)
```

---

## Para cuentas de negocios (si hay multiples negocios)

Si el token tiene acceso a multiples negocios, tambien consultar:

```
GET https://graph.facebook.com/v24.0/{business_id}/owned_ad_accounts
fields: id,name,account_status,disable_reason,currency,amount_spent
limit: 100
```

```
GET https://graph.facebook.com/v24.0/{business_id}/client_ad_accounts
fields: id,name,account_status,disable_reason,currency,amount_spent
limit: 100
```

Para obtener los business_id primero:
```
GET https://graph.facebook.com/v24.0/me/businesses
fields: id,name
limit: 100
```

---

## Mensaje de alerta sugerido

```
ALERTA - Cuenta publicitaria con problema

Cuenta: {nombre} ({id})
Negocio: {business.name}
Estado: {traduccion de account_status}
Razon: {traduccion de disable_reason}
Moneda: {currency}

Accion requerida: Revisar metodo de pago en Meta Business Suite
```
