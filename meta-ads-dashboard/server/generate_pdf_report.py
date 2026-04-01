#!/usr/bin/env python3
"""
Meta Ads Monthly Report Generator — API version
Reads JSON from stdin, generates PDF to stdout (binary).
Based on DT Growth Partners v4.0 template with membretes.
"""

import os, sys, json, re
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle,
    PageBreak, BaseDocTemplate, PageTemplate, Frame,
    NextPageTemplate, Flowable
)

# Brand colors
CORP_BLUE = HexColor("#105F9A")
CORP_BLUE_DARK = HexColor("#0D4F82")
CORP_GRAY = HexColor("#6B7B8D")
CORP_TEAL = HexColor("#2D8A9B")
CORP_ACCENT_BG = HexColor("#EBF3F9")
CORP_TEXT = HexColor("#2C3E50")
CORP_TEXT_LIGHT = HexColor("#7F8C8D")
CORP_LINE = HexColor("#9F9E9C")
PASTEL_RED = HexColor("#FFEAE6")
PASTEL_YELLOW = HexColor("#FFF1CC")
PASTEL_GREEN = HexColor("#DAF2C2")
PASTEL_BLUE = HexColor("#CFE9FE")

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.75 * inch

# Assets path — set via env or default
ASSETS_DIR = os.environ.get('ASSETS_DIR', os.path.join(os.path.dirname(__file__), 'report-assets', 'brand'))
MEMBRETE_PORTADA = os.path.join(ASSETS_DIR, 'membrete_portada.jpeg')
MEMBRETE_CONTENIDO = os.path.join(ASSETS_DIR, 'membrete_contenido.jpeg')


# ============================================================================
# FLOWABLES
# ============================================================================

class SectionBar(Flowable):
    def __init__(self, width=1.2*inch, height=3, color=None):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color or CORP_BLUE
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height + 4)
    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 2, self.width, self.height, 1.5, fill=1, stroke=0)


class CampaignBarChart(Flowable):
    def __init__(self, campaign_data, width=6.5*inch, height=2.8*inch):
        Flowable.__init__(self)
        self.campaign_data = campaign_data
        self.width = width
        self.height = height
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)
    def draw(self):
        c = self.canv
        msg_camps = [d for d in self.campaign_data if d.get('cpr', 0) > 100]
        msg_camps.sort(key=lambda x: x['cpr'])
        if not msg_camps:
            return
        chart_left = 2.2 * inch
        chart_bottom = 0.3 * inch
        chart_width = self.width - chart_left - 0.3 * inch
        chart_height = self.height - 0.6 * inch
        bar_height = min(0.32 * inch, chart_height / len(msg_camps) * 0.7)
        spacing = chart_height / len(msg_camps)
        max_cpr = max(d['cpr'] for d in msg_camps) * 1.15
        c.saveState()
        c.setFont('Helvetica-Bold', 9)
        c.setFillColor(CORP_BLUE_DARK)
        c.drawString(0, self.height - 0.15 * inch, "COSTO POR CONVERSACION (COP)")
        c.restoreState()
        for i, camp in enumerate(msg_camps):
            y = chart_bottom + (len(msg_camps) - 1 - i) * spacing
            bar_width = (camp['cpr'] / max_cpr) * chart_width
            name = clean_name(camp['name'])
            if len(name) > 28: name = name[:26] + '...'
            c.saveState()
            c.setFont('Helvetica', 7.5)
            c.setFillColor(CORP_TEXT)
            c.drawRightString(chart_left - 0.1 * inch, y + bar_height/2 - 3, name)
            c.setFillColor(CORP_BLUE)
            c.roundRect(chart_left, y, bar_width, bar_height, 3, fill=1, stroke=0)
            c.setFont('Helvetica-Bold', 7.5)
            c.setFillColor(CORP_TEXT)
            c.drawString(chart_left + bar_width + 4, y + bar_height/2 - 3, f"${camp['cpr']:,.0f}")
            c.setFont('Helvetica', 6.5)
            c.setFillColor(CORP_TEXT_LIGHT)
            c.drawString(chart_left + bar_width + 4, y + bar_height/2 - 12, f"({int(camp.get('convos',0))} conv.)")
            c.restoreState()


# ============================================================================
# STYLES
# ============================================================================

def get_styles():
    styles = getSampleStyleSheet()
    def sa(style):
        if style.name in styles.byName: styles.byName[style.name] = style
        else: styles.add(style)
    sa(ParagraphStyle('CoverTitle', fontSize=28, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4, leading=34))
    sa(ParagraphStyle('CoverClient', fontSize=24, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold'))
    sa(ParagraphStyle('CoverPrepLabel', fontSize=11, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER, spaceAfter=6))
    sa(ParagraphStyle('CoverPrepName', fontSize=15, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4))
    sa(ParagraphStyle('CoverContact', fontSize=11, textColor=CORP_GRAY, alignment=TA_CENTER))
    sa(ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontSize=19, textColor=CORP_BLUE_DARK, spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold'))
    sa(ParagraphStyle('BodyText', parent=styles['Normal'], fontSize=12, textColor=CORP_TEXT, spaceAfter=8, leading=16))
    sa(ParagraphStyle('SmallText', parent=styles['Normal'], fontSize=10, textColor=CORP_TEXT_LIGHT, spaceAfter=4, leading=13))
    sa(ParagraphStyle('InsightTitle', fontSize=13, textColor=CORP_BLUE_DARK, fontName='Helvetica-Bold', spaceAfter=3))
    sa(ParagraphStyle('InsightBody', fontSize=11, textColor=CORP_TEXT, leading=15, spaceAfter=2))
    sa(ParagraphStyle('RecText', fontSize=12, textColor=CORP_TEXT, leftIndent=15, spaceBefore=6, spaceAfter=6, leading=16))
    return styles


# ============================================================================
# PDF TEMPLATE
# ============================================================================

class ReportPDF(BaseDocTemplate):
    def __init__(self, filename, client_name, month, year, **kwargs):
        self.client_name = client_name
        self.month = month
        self.year = year
        BaseDocTemplate.__init__(self, filename, **kwargs)
        cover_frame = Frame(MARGIN, MARGIN, PAGE_WIDTH - 2*MARGIN, PAGE_HEIGHT - 2*MARGIN - 1.0*inch, id='cover')
        content_frame = Frame(MARGIN, 0.95*inch, PAGE_WIDTH - 2*MARGIN, PAGE_HEIGHT - MARGIN - 0.35*inch - 0.95*inch, id='content')
        self.addPageTemplates([
            PageTemplate(id='cover', frames=[cover_frame], onPage=self._draw_cover),
            PageTemplate(id='content', frames=[content_frame], onPage=self._draw_content),
        ])

    def _draw_cover(self, canvas, doc):
        if os.path.exists(MEMBRETE_PORTADA):
            canvas.drawImage(MEMBRETE_PORTADA, 0, 0, width=PAGE_WIDTH, height=PAGE_HEIGHT, preserveAspectRatio=False, mask='auto')
            canvas.saveState()
            canvas.setFillColor(white)
            canvas.rect(0, 0, PAGE_WIDTH, 1.65 * inch, fill=1, stroke=0)
            canvas.restoreState()

    def _draw_content(self, canvas, doc):
        if os.path.exists(MEMBRETE_CONTENIDO):
            canvas.drawImage(MEMBRETE_CONTENIDO, 0, 0, width=PAGE_WIDTH, height=PAGE_HEIGHT, preserveAspectRatio=False, mask='auto')
        canvas.saveState()
        header_line_y = PAGE_HEIGHT - 1.16 * inch
        canvas.setFillColor(white)
        canvas.rect(0, header_line_y - 4, PAGE_WIDTH, 10, fill=1, stroke=0)
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, header_line_y, PAGE_WIDTH - MARGIN, header_line_y)
        canvas.setFont('Helvetica', 9.5)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawRightString(PAGE_WIDTH - MARGIN, header_line_y + 8, f"{self.client_name}  |  {self.month} {self.year}")
        canvas.setFillColor(white)
        canvas.rect(0, 0, PAGE_WIDTH, 0.95 * inch, fill=1, stroke=0)
        footer_y = 0.55 * inch
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(0.75)
        canvas.line(MARGIN, footer_y + 12, PAGE_WIDTH - MARGIN, footer_y + 12)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawString(MARGIN, footer_y - 2, f"Informe confidencial  --  {self.client_name}  |  {self.month} {self.year}")
        canvas.drawRightString(PAGE_WIDTH - MARGIN, footer_y - 2, f"Pagina {canvas.getPageNumber()}")
        canvas.restoreState()


# ============================================================================
# HELPERS
# ============================================================================

def metric_box(value, label, width=1.65*inch, bg_color=None):
    if bg_color is None: bg_color = PASTEL_BLUE
    val_style = ParagraphStyle('mv', fontSize=22, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=26)
    lbl_style = ParagraphStyle('ml', fontSize=10, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER, leading=13)
    content = [[Paragraph(value, val_style)], [Spacer(1, 4)], [Paragraph(label, lbl_style)]]
    inner = Table(content, colWidths=[width])
    inner.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'), ('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    outer = Table([[inner]], colWidths=[width], rowHeights=[85])
    outer.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), bg_color), ('BOX',(0,0),(-1,-1), 0.75, CORP_BLUE),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'), ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),6), ('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),10), ('BOTTOMPADDING',(0,0),(-1,-1),10),
    ]))
    return outer

def metrics_row(items):
    boxes = [metric_box(m['value'], m['label'], bg_color=m.get('bg')) for m in items]
    col_w = (PAGE_WIDTH - 2*MARGIN) / len(boxes)
    t = Table([boxes], colWidths=[col_w]*len(boxes))
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('ALIGN',(0,0),(-1,-1),'CENTER')]))
    return t

def data_table(headers, rows, col_widths=None):
    data = [headers] + rows
    if not col_widths: col_widths = [(PAGE_WIDTH - 2*MARGIN) / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), CORP_BLUE), ('TEXTCOLOR',(0,0),(-1,0), white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'), ('FONTSIZE',(0,0),(-1,0), 11),
        ('ALIGN',(0,0),(-1,0),'CENTER'), ('BOTTOMPADDING',(0,0),(-1,0), 8), ('TOPPADDING',(0,0),(-1,0), 8),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'), ('FONTSIZE',(0,1),(-1,-1), 10),
        ('ALIGN',(0,1),(-1,-1),'CENTER'), ('ALIGN',(0,1),(0,-1),'LEFT'),
        ('VALIGN',(0,1),(-1,-1),'MIDDLE'), ('BOTTOMPADDING',(0,1),(-1,-1), 6), ('TOPPADDING',(0,1),(-1,-1), 6),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [white, CORP_ACCENT_BG]),
        ('GRID',(0,0),(-1,-1), 0.5, HexColor("#BDC3C7")),
    ]))
    return t

def insight_box(title, content, styles, bg_color=None):
    if bg_color is None: bg_color = PASTEL_BLUE
    data = [[Paragraph(f"<b>{title}</b>", styles['InsightTitle'])], [Paragraph(content, styles['InsightBody'])]]
    t = Table(data, colWidths=[PAGE_WIDTH - 2*MARGIN])
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), bg_color), ('BOX',(0,0),(-1,-1), 1.5, CORP_BLUE),
        ('LINEBEFORE',(0,0),(0,-1), 4, CORP_BLUE),
        ('LEFTPADDING',(0,0),(-1,-1), 14), ('RIGHTPADDING',(0,0),(-1,-1), 12),
        ('TOPPADDING',(0,0),(-1,-1), 8), ('BOTTOMPADDING',(0,0),(-1,-1), 8),
    ]))
    return t

def fmt_currency(v):
    v = float(v) if not isinstance(v, (int, float)) else v
    return f"${v:,.0f}"
def fmt_number(v):
    v = float(v) if not isinstance(v, (int, float)) else v
    if v >= 1000000: return f"{v/1000000:.1f}M"
    if v >= 1000: return f"{v/1000:.1f}K"
    return f"{v:,.0f}"

def clean_name(name):
    return re.sub(r'^[^\x00-\x7F]+\s*DTGP\s*-\s*', '', str(name)).strip()


# ============================================================================
# MAIN — Read JSON from stdin, generate PDF to file
# ============================================================================

def main():
    input_data = json.loads(sys.stdin.read())

    CLIENT_NAME = input_data['clientName']
    MONTH = input_data['month']
    YEAR = input_data['year']
    OUTPUT_PATH = input_data['outputPath']
    campaigns = input_data['campaigns']

    # Process campaigns
    total_spend = sum(c['spend'] for c in campaigns)
    total_reach = sum(c['reach'] for c in campaigns)
    total_impressions = sum(c['impressions'] for c in campaigns)
    total_clicks = sum(c.get('clicks', 0) for c in campaigns)

    msg_camps = [c for c in campaigns if c['type'] == 'Mensajes']
    other_camps = [c for c in campaigns if c['type'] != 'Mensajes']

    msg_spend = sum(c['spend'] for c in msg_camps)
    msg_convos = sum(c.get('conversations', 0) for c in msg_camps)
    msg_new = sum(c.get('firstReplies', 0) for c in msg_camps)
    msg_cpr = msg_spend / msg_convos if msg_convos > 0 else 0
    awareness_spend = sum(c['spend'] for c in other_camps)
    awareness_results = sum(c.get('result', 0) for c in other_camps)

    # Best campaigns
    msg_with_conv = [c for c in msg_camps if c.get('conversations', 0) > 0]
    best_camp = min(msg_with_conv, key=lambda c: c['spend']/c['conversations']) if msg_with_conv else None
    top_vol = max(msg_with_conv, key=lambda c: c['conversations']) if msg_with_conv else None

    if best_camp:
        best_camp['cpr_conv'] = best_camp['spend'] / best_camp['conversations']
        best_camp['clean_name'] = clean_name(best_camp['name'])
    if top_vol:
        top_vol['cpr_conv'] = top_vol['spend'] / top_vol['conversations']
        top_vol['clean_name'] = clean_name(top_vol['name'])

    msg_pct = msg_spend / total_spend * 100 if total_spend > 0 else 0

    # Build PDF
    styles = get_styles()
    elements = []

    # PAGE 1: COVER
    meta_tag_style = ParagraphStyle('MetaTag', fontSize=14, textColor=CORP_GRAY, alignment=TA_CENTER, fontName='Helvetica', leading=14)

    elements.append(Spacer(1, 0.6*inch))
    elements.append(Spacer(1, 0.6*inch))
    elements.append(Paragraph("INFORME DE RESULTADOS", styles['CoverTitle']))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Meta Ads  |  {MONTH} {YEAR}", meta_tag_style))

    line_data = [['']]
    line_t = Table(line_data, colWidths=[2.5*inch], rowHeights=[2])
    line_t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1), CORP_BLUE)]))
    line_t.hAlign = 'CENTER'
    elements.append(Spacer(1, 8))
    elements.append(line_t)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(CLIENT_NAME.upper(), styles['CoverClient']))
    elements.append(Spacer(1, 2.2*inch))
    elements.append(Paragraph("Preparado por", styles['CoverPrepLabel']))
    elements.append(Paragraph("DT Growth Partners", styles['CoverPrepName']))
    elements.append(Paragraph("dtgrowthpartners.com  |  +57 300 7189383", styles['CoverContact']))
    elements.append(NextPageTemplate('content'))
    elements.append(PageBreak())

    # PAGE 2: RESUMEN EJECUTIVO
    elements.append(Paragraph("RESUMEN EJECUTIVO", styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 10))

    row1 = [
        {'value': f"${total_spend/1000000:.1f}M" if total_spend >= 1000000 else fmt_currency(total_spend), 'label': 'INVERSION TOTAL', 'bg': PASTEL_BLUE},
        {'value': fmt_number(msg_convos), 'label': 'CONVERSACIONES WP', 'bg': PASTEL_GREEN},
        {'value': fmt_currency(msg_cpr), 'label': 'COSTO POR CONVERSACION', 'bg': PASTEL_YELLOW},
        {'value': fmt_number(msg_new), 'label': 'CONTACTOS NUEVOS', 'bg': PASTEL_GREEN},
    ]
    elements.append(metrics_row(row1))
    elements.append(Spacer(1, 8))

    adset_reach = input_data.get('adsetReach', total_reach)
    row2 = [
        {'value': fmt_number(adset_reach), 'label': 'ALCANCE TOTAL', 'bg': PASTEL_BLUE},
        {'value': fmt_number(total_impressions), 'label': 'IMPRESIONES', 'bg': PASTEL_BLUE},
        {'value': fmt_number(total_clicks), 'label': 'CLICS EN ENLACE', 'bg': PASTEL_BLUE},
        {'value': f"{msg_pct:.0f}%", 'label': 'INVERSION EN MENSAJES', 'bg': PASTEL_YELLOW},
    ]
    elements.append(metrics_row(row2))
    elements.append(Spacer(1, 18))

    summary = (
        f'Durante {MONTH.lower()} {YEAR}, se invirtieron <b>{fmt_currency(total_spend)} COP</b> en campanas de Meta Ads '
        f'para {CLIENT_NAME}. Las campanas de mensajes representaron el <b>{msg_pct:.0f}%</b> '
        f'de la inversion y generaron <b>{int(msg_convos)} conversaciones de WhatsApp</b>, de las cuales '
        f'<b>{int(msg_new)}</b> fueron contactos completamente nuevos. '
        f'El costo promedio por conversacion fue de <b>{fmt_currency(msg_cpr)} COP</b>.'
    )
    elements.append(Paragraph(summary, styles['BodyText']))

    if best_camp:
        result_text = (
            f'La campana con mejor rendimiento fue <b>{best_camp["clean_name"]}</b> con un costo por conversacion de '
            f'<b>{fmt_currency(best_camp["cpr_conv"])} COP</b>'
        )
        if top_vol and top_vol['name'] != best_camp['name']:
            result_text += f', mientras que <b>{top_vol["clean_name"]}</b> fue la de mayor volumen con <b>{int(top_vol["conversations"])} conversaciones</b> generadas.'
        else:
            result_text += '.'
        elements.append(Paragraph(result_text, styles['BodyText']))

    elements.append(PageBreak())

    # PAGE 3: RENDIMIENTO POR CAMPAÑA
    elements.append(Paragraph("RENDIMIENTO POR CAMPANA", styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))

    type_order = {'Mensajes': 0, 'Video': 1, 'Trafico': 2, 'Clics': 3}
    sorted_camps = sorted(campaigns, key=lambda c: (type_order.get(c['type'], 9), -c['spend']))

    headers = ['Campana', 'Tipo', 'Inversion', 'Resultados', 'CPR', 'Alcance']
    rows = []
    row_cprs = []
    for c in sorted_camps:
        name = clean_name(c['name'])
        if len(name) > 25: name = name[:23] + '..'
        res = c.get('result', 0)
        cpr = c['spend'] / res if res > 0 else 0
        rows.append([name, c['type'], fmt_currency(c['spend']), fmt_number(res) if res > 0 else '--', fmt_currency(cpr) if cpr > 0 else '--', fmt_number(c['reach'])])
        row_cprs.append((cpr, c['type'] == 'Mensajes'))

    col_w = [2.2*inch, 0.75*inch, 0.85*inch, 0.8*inch, 0.8*inch, 0.7*inch]
    table_data = [headers] + rows
    camp_table = Table(table_data, colWidths=col_w)
    base_style = [
        ('BACKGROUND',(0,0),(-1,0), CORP_BLUE), ('TEXTCOLOR',(0,0),(-1,0), white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'), ('FONTSIZE',(0,0),(-1,0), 11),
        ('ALIGN',(0,0),(-1,0),'CENTER'), ('BOTTOMPADDING',(0,0),(-1,0), 8), ('TOPPADDING',(0,0),(-1,0), 8),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'), ('FONTSIZE',(0,1),(-1,-1), 10),
        ('ALIGN',(0,1),(-1,-1),'CENTER'), ('ALIGN',(0,1),(0,-1),'LEFT'),
        ('VALIGN',(0,1),(-1,-1),'MIDDLE'), ('BOTTOMPADDING',(0,1),(-1,-1), 6), ('TOPPADDING',(0,1),(-1,-1), 6),
        ('GRID',(0,0),(-1,-1), 0.5, HexColor("#BDC3C7")),
    ]
    for i in range(len(rows)):
        bg = white if i % 2 == 0 else PASTEL_BLUE
        base_style.append(('BACKGROUND', (0, i+1), (-1, i+1), bg))
    msg_cprs = [(i, cpr) for i, (cpr, is_msg) in enumerate(row_cprs) if is_msg and cpr > 0]
    if msg_cprs:
        best_idx = min(msg_cprs, key=lambda x: x[1])[0]
        worst_idx = max(msg_cprs, key=lambda x: x[1])[0]
        base_style.append(('BACKGROUND', (0, best_idx+1), (-1, best_idx+1), PASTEL_GREEN))
        if worst_idx != best_idx:
            base_style.append(('BACKGROUND', (0, worst_idx+1), (-1, worst_idx+1), PASTEL_RED))
    camp_table.setStyle(TableStyle(base_style))
    elements.append(camp_table)

    elements.append(Spacer(1, 20))
    elements.append(Paragraph("RESULTADOS DE NEGOCIO", styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Paragraph("Esta seccion refleja los resultados de negocio reportados por el cliente:", styles['BodyText']))
    elements.append(Spacer(1, 6))
    biz_headers = ['Metrica', 'Cantidad', 'Valor Estimado']
    biz_rows = [['Clientes Generados (Ventas Cerradas)', '____', '$____'], ['Clientes Potenciales (En Negociacion)', '____', '$____'], ['Tickets / Cotizaciones', '____', '$____']]
    elements.append(data_table(biz_headers, biz_rows, [3.2*inch, 1.4*inch, 1.5*inch]))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("* Datos a completar por el cliente para calcular ROAS real", styles['SmallText']))
    elements.append(PageBreak())

    # PAGE 4: INSIGHTS + RECOMENDACIONES
    elements.append(Paragraph("INSIGHTS Y APRENDIZAJES", styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))

    if best_camp:
        elements.append(insight_box(
            f'Mejor CPR: {best_camp["clean_name"][:40]}',
            f'Menor costo por conversacion del mes a {fmt_currency(best_camp["cpr_conv"])} COP, generando {int(best_camp["conversations"])} conversaciones de WhatsApp con {fmt_currency(best_camp["spend"])} COP de inversion.',
            styles, bg_color=PASTEL_GREEN))
        elements.append(Spacer(1, 6))

    if top_vol and top_vol['name'] != (best_camp['name'] if best_camp else ''):
        elements.append(insight_box(
            f'Mayor volumen: {top_vol["clean_name"][:40]}',
            f'Lider en volumen con {int(top_vol["conversations"])} conversaciones y {int(top_vol.get("firstReplies",0))} contactos nuevos. CPR: {fmt_currency(top_vol["cpr_conv"])} COP.',
            styles, bg_color=PASTEL_GREEN))
        elements.append(Spacer(1, 6))

    elements.append(insight_box(
        f'{int(msg_new)} contactos nuevos por WhatsApp',
        f'Las campanas de mensajes generaron {int(msg_convos)} conversaciones y {int(msg_new)} contactos nuevos. Inversion en mensajes: {fmt_currency(msg_spend)} COP ({msg_pct:.0f}%). CPR promedio: {fmt_currency(msg_cpr)} COP.',
        styles, bg_color=PASTEL_BLUE))
    elements.append(Spacer(1, 6))

    if awareness_spend > 0:
        elements.append(insight_box(
            'Reconocimiento y trafico complementan el embudo',
            f'{fmt_currency(awareness_spend)} COP ({awareness_spend/total_spend*100:.0f}%) en campanas de video (ThruPlay) y trafico a Instagram generaron {int(awareness_results):,} impactos de marca.',
            styles, bg_color=PASTEL_YELLOW))
        elements.append(Spacer(1, 6))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("RECOMENDACIONES PROXIMO MES", styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))

    recommendations = [
        f'Preparar promociones o planes especiales que podamos impulsar con las campanas de WhatsApp -- los resultados de {MONTH.lower()} muestran que los contactos llegan, el siguiente paso es tener ofertas atractivas listas.',
        'Responder los mensajes de WhatsApp lo mas rapido posible (idealmente en menos de 5 minutos). Cada minuto de demora reduce la probabilidad de convertir ese contacto en cliente.',
        'Compartir testimonios y fotos/videos de clientes reales -- este tipo de contenido genera mas confianza y reduce el costo de adquisicion.',
        'Reportar las ventas cerradas del mes para calcular el retorno real de la inversion (ROAS) y optimizar las campanas segun lo que mas genera ingresos.',
    ]
    rec_elements = []
    for i, rec in enumerate(recommendations, 1):
        rec_elements.append([Paragraph(f"<b>{i}.</b>  {rec}", styles['RecText'])])
    rec_table = Table(rec_elements, colWidths=[PAGE_WIDTH - 2*MARGIN])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), PASTEL_YELLOW), ('BOX',(0,0),(-1,-1), 1, CORP_BLUE),
        ('LEFTPADDING',(0,0),(-1,-1), 12), ('RIGHTPADDING',(0,0),(-1,-1), 12),
        ('TOPPADDING',(0,0),(0,0), 10), ('BOTTOMPADDING',(-1,-1),(-1,-1), 10),
    ]))
    elements.append(rec_table)

    # PAGE 5: CLOSING
    elements.append(PageBreak())
    elements.append(Spacer(1, 2.2*inch))
    closing_s = ParagraphStyle('closing', fontSize=16, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, spaceBefore=20, spaceAfter=20)
    elements.append(Paragraph("Gracias por confiar en nosotros!", closing_s))
    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph("Tienes preguntas sobre este reporte?", ParagraphStyle('q', fontSize=12, textColor=CORP_TEXT, alignment=TA_CENTER)))
    contact_s = ParagraphStyle('contact', fontSize=13, textColor=CORP_BLUE, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceBefore=8)
    elements.append(Paragraph("+57 300 7189383", contact_s))
    elements.append(Paragraph("dtgrowthpartners.com", contact_s))
    elements.append(Spacer(1, 1*inch))
    slogan_s = ParagraphStyle('slogan', fontSize=13, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER)
    elements.append(Paragraph("Impulsamos crecimiento con estrategia, tecnologia y ejecucion.", slogan_s))

    # Build PDF
    doc = ReportPDF(OUTPUT_PATH, client_name=CLIENT_NAME, month=MONTH, year=YEAR,
        pagesize=letter, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN + 0.3*inch, bottomMargin=MARGIN)
    doc.build(elements)
    print(f"OK:{OUTPUT_PATH}", file=sys.stderr)


if __name__ == '__main__':
    main()
