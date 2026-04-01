#!/usr/bin/env python3
"""
Equilibrio Clinic Custom PDF Report — sede split + ventas integration
Reads JSON from stdin, generates PDF with membretes.
"""

import os, sys, json, re, csv, io
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
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
CORP_TEXT = HexColor("#2C3E50")
CORP_TEXT_LIGHT = HexColor("#7F8C8D")
CORP_ACCENT_BG = HexColor("#EBF3F9")
PASTEL_RED = HexColor("#FFEAE6")
PASTEL_YELLOW = HexColor("#FFF1CC")
PASTEL_GREEN = HexColor("#DAF2C2")
PASTEL_BLUE = HexColor("#CFE9FE")

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.75 * inch

ASSETS_DIR = os.environ.get('ASSETS_DIR', os.path.join(os.path.dirname(__file__), 'report-assets', 'brand'))
MEMBRETE_PORTADA = os.path.join(ASSETS_DIR, 'membrete_portada.jpeg')
MEMBRETE_CONTENIDO = os.path.join(ASSETS_DIR, 'membrete_contenido.jpeg')


class SectionBar(Flowable):
    def __init__(self, width=1.2*inch, height=3):
        Flowable.__init__(self)
        self.width = width
        self.height = height
    def wrap(self, a, b): return (self.width, self.height + 4)
    def draw(self):
        self.canv.setFillColor(CORP_BLUE)
        self.canv.roundRect(0, 2, self.width, self.height, 1.5, fill=1, stroke=0)


def get_styles():
    styles = getSampleStyleSheet()
    def sa(s):
        if s.name in styles.byName: styles.byName[s.name] = s
        else: styles.add(s)
    sa(ParagraphStyle('CoverTitle', fontSize=28, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4, leading=34))
    sa(ParagraphStyle('CoverClient', fontSize=24, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold'))
    sa(ParagraphStyle('CoverPrepLabel', fontSize=11, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER, spaceAfter=6))
    sa(ParagraphStyle('CoverPrepName', fontSize=15, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4))
    sa(ParagraphStyle('CoverContact', fontSize=11, textColor=CORP_GRAY, alignment=TA_CENTER))
    sa(ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontSize=19, textColor=CORP_BLUE_DARK, spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold'))
    sa(ParagraphStyle('SubSection', fontSize=14, textColor=CORP_BLUE, spaceBefore=10, spaceAfter=6, fontName='Helvetica-Bold'))
    sa(ParagraphStyle('BodyText', parent=styles['Normal'], fontSize=12, textColor=CORP_TEXT, spaceAfter=8, leading=16))
    sa(ParagraphStyle('SmallText', parent=styles['Normal'], fontSize=10, textColor=CORP_TEXT_LIGHT, spaceAfter=4, leading=13))
    sa(ParagraphStyle('InsightTitle', fontSize=13, textColor=CORP_BLUE_DARK, fontName='Helvetica-Bold', spaceAfter=3))
    sa(ParagraphStyle('InsightBody', fontSize=11, textColor=CORP_TEXT, leading=15, spaceAfter=2))
    sa(ParagraphStyle('RecText', fontSize=12, textColor=CORP_TEXT, leftIndent=15, spaceBefore=6, spaceAfter=6, leading=16))
    return styles


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
        y = PAGE_HEIGHT - 1.16 * inch
        canvas.setFillColor(white)
        canvas.rect(0, y - 4, PAGE_WIDTH, 10, fill=1, stroke=0)
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
        canvas.setFont('Helvetica', 9.5)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawRightString(PAGE_WIDTH - MARGIN, y + 8, self.client_name + '  |  ' + self.month + ' ' + self.year)
        canvas.setFillColor(white)
        canvas.rect(0, 0, PAGE_WIDTH, 0.95 * inch, fill=1, stroke=0)
        fy = 0.55 * inch
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(0.75)
        canvas.line(MARGIN, fy + 12, PAGE_WIDTH - MARGIN, fy + 12)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawString(MARGIN, fy - 2, 'Informe confidencial -- ' + self.client_name + '  |  ' + self.month + ' ' + self.year)
        canvas.drawRightString(PAGE_WIDTH - MARGIN, fy - 2, 'Pagina ' + str(canvas.getPageNumber()))
        canvas.restoreState()


# Helpers
def f_cur(v):
    v = float(v) if not isinstance(v, (int, float)) else v
    return '$' + '{:,.0f}'.format(v)

def f_num(v):
    v = float(v) if not isinstance(v, (int, float)) else v
    if v >= 1e6: return '{:.1f}M'.format(v/1e6)
    if v >= 1e3: return '{:.1f}K'.format(v/1e3)
    return '{:,.0f}'.format(v)

def clean_name(n):
    return re.sub(r'^[^\x00-\x7F]+\s*DTGP\s*-\s*', '', str(n)).strip()

def metric_box(value, label, width=1.5*inch, bg=None):
    if bg is None: bg = PASTEL_BLUE
    vs = ParagraphStyle('mv', fontSize=20, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=24)
    ls = ParagraphStyle('ml', fontSize=9, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER, leading=11)
    inner = Table([[Paragraph(str(value), vs)], [Spacer(1, 2)], [Paragraph(label, ls)]], colWidths=[width])
    inner.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'), ('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    outer = Table([[inner]], colWidths=[width], rowHeights=[75])
    outer.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1), bg), ('BOX',(0,0),(-1,-1), 0.75, CORP_BLUE),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'), ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('LEFTPADDING',(0,0),(-1,-1),4), ('RIGHTPADDING',(0,0),(-1,-1),4),
        ('TOPPADDING',(0,0),(-1,-1),8), ('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return outer

def metrics_row(items, ncols=4):
    boxes = [metric_box(m['value'], m['label'], bg=m.get('bg')) for m in items]
    w = (PAGE_WIDTH - 2*MARGIN) / ncols
    t = Table([boxes], colWidths=[w]*ncols)
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('ALIGN',(0,0),(-1,-1),'CENTER')]))
    return t

def data_table(headers, rows, col_widths=None):
    data = [headers] + rows
    if not col_widths: col_widths = [(PAGE_WIDTH - 2*MARGIN) / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0), CORP_BLUE), ('TEXTCOLOR',(0,0),(-1,0), white),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'), ('FONTSIZE',(0,0),(-1,0), 10),
        ('ALIGN',(0,0),(-1,0),'CENTER'), ('BOTTOMPADDING',(0,0),(-1,0), 6), ('TOPPADDING',(0,0),(-1,0), 6),
        ('FONTNAME',(0,1),(-1,-1),'Helvetica'), ('FONTSIZE',(0,1),(-1,-1), 9),
        ('ALIGN',(0,1),(-1,-1),'CENTER'), ('ALIGN',(0,1),(0,-1),'LEFT'),
        ('VALIGN',(0,1),(-1,-1),'MIDDLE'), ('BOTTOMPADDING',(0,1),(-1,-1), 5), ('TOPPADDING',(0,1),(-1,-1), 5),
        ('ROWBACKGROUNDS',(0,1),(-1,-1), [white, CORP_ACCENT_BG]),
        ('GRID',(0,0),(-1,-1), 0.5, HexColor("#BDC3C7"))]))
    return t

def insight_box(title, content, styles, bg=None):
    if bg is None: bg = PASTEL_BLUE
    data = [[Paragraph('<b>' + title + '</b>', styles['InsightTitle'])], [Paragraph(content, styles['InsightBody'])]]
    t = Table(data, colWidths=[PAGE_WIDTH - 2*MARGIN])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1), bg), ('BOX',(0,0),(-1,-1), 1.5, CORP_BLUE),
        ('LINEBEFORE',(0,0),(0,-1), 4, CORP_BLUE), ('LEFTPADDING',(0,0),(-1,-1), 14),
        ('RIGHTPADDING',(0,0),(-1,-1), 12), ('TOPPADDING',(0,0),(-1,-1), 8), ('BOTTOMPADDING',(0,0),(-1,-1), 8)]))
    return t


def classify_sede(name):
    nl = str(name).lower()
    if any(k in nl for k in ['castellana', 'cast']): return 'Castellana'
    if any(k in nl for k in ['bocagrande', 'bocag']): return 'Bocagrande'
    return 'General'

def classify_type(name, objective=''):
    nl = name.lower()
    if objective == 'OUTCOME_AWARENESS' or any(k in nl for k in ['reconocimiento', 'thruplay', 'true play']): return 'Video'
    if objective == 'OUTCOME_TRAFFIC' or any(k in nl for k in ['trafico', 'perfil ig']): return 'Trafico'
    return 'Mensajes'

def aggregate_sede(camps):
    s = {'spend': 0, 'imp': 0, 'reach': 0, 'conv': 0, 'first': 0, 'clicks': 0, 'reactions': 0, 'comments': 0, 'saves': 0, 'shares': 0}
    for c in camps:
        s['spend'] += c['spend']; s['imp'] += c['impressions']; s['reach'] += c['reach']
        s['conv'] += c.get('conversations', 0); s['first'] += c.get('firstReplies', 0)
        s['clicks'] += c.get('clicks', 0); s['reactions'] += c.get('reactions', 0)
        s['comments'] += c.get('comments', 0); s['saves'] += c.get('saves', 0); s['shares'] += c.get('shares', 0)
    s['cpm'] = (s['spend'] / s['imp'] * 1000) if s['imp'] > 0 else 0
    s['cpr'] = (s['spend'] / s['conv']) if s['conv'] > 0 else 0
    return s


def main():
    input_data = json.loads(sys.stdin.read())
    CLIENT_NAME = input_data['clientName']
    MONTH = input_data['month']
    YEAR = input_data['year']
    OUTPUT_PATH = input_data['outputPath']
    campaigns = input_data['campaigns']
    adsets = input_data.get('adsets', [])
    adset_reach = int(input_data.get('adsetReach', 0) or 0)
    ventas_csv = input_data.get('ventasCsv', None)

    # Classify by sede using ADSET names (more accurate than campaign names)
    # because a campaign like "ventas castellana" can have adsets for both sedes
    use_adsets = len(adsets) > 0
    items = adsets if use_adsets else campaigns
    name_field = 'adsetName' if use_adsets else 'name'

    castellana_items = [c for c in items if classify_sede(c.get(name_field, '')) == 'Castellana']
    bocagrande_items = [c for c in items if classify_sede(c.get(name_field, '')) == 'Bocagrande']
    general_items = [c for c in items if classify_sede(c.get(name_field, '')) == 'General']

    cast_totals = aggregate_sede(castellana_items)
    boca_totals = aggregate_sede(bocagrande_items)
    gen_totals = aggregate_sede(general_items)

    total_spend = sum(c['spend'] for c in campaigns)
    total_imp = sum(c['impressions'] for c in campaigns)
    total_conv = cast_totals['conv'] + boca_totals['conv'] + gen_totals['conv']
    total_first = cast_totals['first'] + boca_totals['first'] + gen_totals['first']
    total_clicks = sum(c.get('clicks', 0) for c in campaigns)
    total_reactions = sum(c.get('reactions', 0) for c in campaigns)
    total_comments = sum(c.get('comments', 0) for c in campaigns)
    total_saves = sum(c.get('saves', 0) for c in campaigns)
    total_shares = sum(c.get('shares', 0) for c in campaigns)
    total_cpm = (total_spend / total_imp * 1000) if total_imp > 0 else 0

    msg_camps = [c for c in campaigns if classify_type(c['name'], c.get('objective', '')) == 'Mensajes']
    msg_spend = sum(c['spend'] for c in msg_camps)
    msg_cpr = msg_spend / total_conv if total_conv > 0 else 0
    msg_pct = msg_spend / total_spend * 100 if total_spend > 0 else 0

    styles = get_styles()
    elements = []

    # === PAGE 1: COVER ===
    meta_tag = ParagraphStyle('mt', fontSize=14, textColor=CORP_GRAY, alignment=TA_CENTER, fontName='Helvetica', leading=14)
    elements.append(Spacer(1, 1.2*inch))
    elements.append(Paragraph('INFORME DE RESULTADOS', styles['CoverTitle']))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph('Meta Ads  |  ' + MONTH + ' ' + YEAR, meta_tag))
    ln = Table([['']], colWidths=[2.5*inch], rowHeights=[2])
    ln.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1), CORP_BLUE)]))
    ln.hAlign = 'CENTER'
    elements.append(Spacer(1, 8)); elements.append(ln); elements.append(Spacer(1, 20))
    elements.append(Paragraph(CLIENT_NAME.upper(), styles['CoverClient']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph('Sedes: Castellana y Bocagrande', ParagraphStyle('sub', fontSize=12, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER)))
    elements.append(Spacer(1, 1.8*inch))
    elements.append(Paragraph('Preparado por', styles['CoverPrepLabel']))
    elements.append(Paragraph('DT Growth Partners', styles['CoverPrepName']))
    elements.append(Paragraph('dtgrowthpartners.com  |  +57 300 7189383', styles['CoverContact']))
    elements.append(NextPageTemplate('content'))
    elements.append(PageBreak())

    # === PAGE 2: RESUMEN EJECUTIVO ===
    elements.append(Paragraph('RESUMEN EJECUTIVO', styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 8))

    row1 = [
        {'value': f_num(total_spend), 'label': 'INVERSION TOTAL', 'bg': PASTEL_BLUE},
        {'value': f_num(total_conv), 'label': 'CONVERSACIONES WP', 'bg': PASTEL_GREEN},
        {'value': f_cur(msg_cpr), 'label': 'CPR MENSAJES', 'bg': PASTEL_YELLOW},
        {'value': f_num(total_first), 'label': 'CONTACTOS NUEVOS', 'bg': PASTEL_GREEN},
    ]
    elements.append(metrics_row(row1))
    elements.append(Spacer(1, 6))

    row2 = [
        {'value': f_num(adset_reach), 'label': 'ALCANCE', 'bg': PASTEL_BLUE},
        {'value': f_num(total_imp), 'label': 'IMPRESIONES', 'bg': PASTEL_BLUE},
        {'value': f_cur(total_cpm), 'label': 'CPM', 'bg': PASTEL_BLUE},
        {'value': str(int(msg_pct)) + '%', 'label': 'INV. EN MENSAJES', 'bg': PASTEL_YELLOW},
    ]
    elements.append(metrics_row(row2))
    elements.append(Spacer(1, 6))

    # Engagement metrics
    row3 = [
        {'value': f_num(total_reactions), 'label': 'REACCIONES', 'bg': PASTEL_BLUE},
        {'value': f_num(total_comments), 'label': 'COMENTARIOS', 'bg': PASTEL_BLUE},
        {'value': f_num(total_saves), 'label': 'GUARDADOS', 'bg': PASTEL_GREEN},
        {'value': f_num(total_shares), 'label': 'COMPARTIDOS', 'bg': PASTEL_GREEN},
    ]
    elements.append(metrics_row(row3))
    elements.append(Spacer(1, 12))

    # Narrative
    summary = (
        'Durante ' + MONTH.lower() + ' ' + YEAR + ', se invirtieron <b>' + f_cur(total_spend) + ' COP</b> en campanas de Meta Ads para '
        + CLIENT_NAME + '. Se generaron <b>' + str(int(total_conv)) + ' conversaciones</b> de WhatsApp, de las cuales <b>'
        + str(int(total_first)) + '</b> fueron contactos nuevos. CPR promedio: <b>' + f_cur(msg_cpr) + ' COP</b>.'
    )
    elements.append(Paragraph(summary, styles['BodyText']))
    elements.append(PageBreak())

    # === PAGE 3: RENDIMIENTO POR SEDE ===
    elements.append(Paragraph('RENDIMIENTO POR SEDE', styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 8))

    sede_headers = ['SEDE', 'Inversion', 'Conversaciones', 'Contactos Nuevos', 'CPR', 'Alcance', 'CPM']
    sede_rows = [
        ['Castellana', f_cur(cast_totals['spend']), str(cast_totals['conv']), str(cast_totals['first']),
         f_cur(cast_totals['cpr']), f_num(cast_totals['reach']), f_cur(cast_totals['cpm'])],
        ['Bocagrande', f_cur(boca_totals['spend']), str(boca_totals['conv']), str(boca_totals['first']),
         f_cur(boca_totals['cpr']), f_num(boca_totals['reach']), f_cur(boca_totals['cpm'])],
        ['General', f_cur(gen_totals['spend']), str(gen_totals['conv']), str(gen_totals['first']),
         f_cur(gen_totals['cpr']), f_num(gen_totals['reach']), f_cur(gen_totals['cpm'])],
    ]
    elements.append(data_table(sede_headers, sede_rows, [1.1*inch, 0.9*inch, 1*inch, 0.9*inch, 0.8*inch, 0.7*inch, 0.7*inch]))
    elements.append(Spacer(1, 12))

    # Engagement by sede
    elements.append(Paragraph('Engagement por Sede', styles['SubSection']))
    eng_headers = ['SEDE', 'Reacciones', 'Comentarios', 'Guardados', 'Compartidos']
    eng_rows = [
        ['Castellana', f_num(cast_totals['reactions']), str(cast_totals['comments']), str(cast_totals['saves']), str(cast_totals['shares'])],
        ['Bocagrande', f_num(boca_totals['reactions']), str(boca_totals['comments']), str(boca_totals['saves']), str(boca_totals['shares'])],
        ['General', f_num(gen_totals['reactions']), str(gen_totals['comments']), str(gen_totals['saves']), str(gen_totals['shares'])],
    ]
    elements.append(data_table(eng_headers, eng_rows, [1.2*inch, 1.2*inch, 1.1*inch, 1.1*inch, 1.1*inch]))
    elements.append(Spacer(1, 12))

    # Campaign table by sede (uses adsets if available for accurate sede split)
    sede_items_map = [('Castellana', castellana_items), ('Bocagrande', bocagrande_items), ('General', general_items)]
    first_sede = True
    for sede_name, sede_camps in sede_items_map:
        if not sede_camps: continue
        if not first_sede:
            elements.append(PageBreak())
        first_sede = False
        elements.append(Paragraph('Campanas ' + sede_name, styles['SubSection']))
        ch = ['Campana', 'Tipo', 'Inversion', 'Resultados', 'CPR', 'Alcance']
        cr = []
        for c in sorted(sede_camps, key=lambda x: -x['spend']):
            name = clean_name(c.get(name_field, c.get('name', '')))
            if len(name) > 22: name = name[:20] + '..'
            tp = classify_type(c['name'], c.get('objective', ''))
            res = c.get('result', c.get('conversations', 0))
            cpr = c['spend'] / res if res > 0 else 0
            cr.append([name, tp, f_cur(c['spend']), f_num(res) if res > 0 else '--', f_cur(cpr) if cpr > 0 else '--', f_num(c['reach'])])
        elements.append(data_table(ch, cr, [2*inch, 0.7*inch, 0.85*inch, 0.75*inch, 0.8*inch, 0.7*inch]))
        elements.append(Spacer(1, 8))

    elements.append(PageBreak())

    # === VENTAS (if CSV provided) ===
    if ventas_csv:
        elements.append(Paragraph('RESULTADOS DE VENTAS', styles['SectionTitle']))
        elements.append(SectionBar())
        elements.append(Spacer(1, 8))
        elements.append(Paragraph('Datos proporcionados por el cliente.', styles['SmallText']))
        elements.append(Spacer(1, 6))

        # Parse simple CSV (expects columns: Sede, Concepto, Valor)
        try:
            reader = csv.DictReader(io.StringIO(ventas_csv))
            ventas_rows = list(reader)
            if ventas_rows:
                headers_v = list(ventas_rows[0].keys())
                rows_v = [[r.get(h, '') for h in headers_v] for r in ventas_rows[:30]]  # Limit to 30 rows
                cw = [(PAGE_WIDTH - 2*MARGIN) / len(headers_v)] * len(headers_v)
                elements.append(data_table(headers_v, rows_v, cw))
        except Exception as e:
            elements.append(Paragraph('Error procesando CSV de ventas: ' + str(e), styles['BodyText']))

        elements.append(PageBreak())

    # === BUSINESS RESULTS ===
    elements.append(PageBreak())
    elements.append(Paragraph('RESULTADOS DE NEGOCIO', styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))

    # Try to parse ventas data if available
    ventas_parsed = input_data.get('ventasParsed', None)
    if ventas_parsed:
        # Use parsed ventas data
        elements.append(Paragraph('Datos de cierre proporcionados por el cliente:', styles['SmallText']))
        elements.append(Spacer(1, 6))
        biz_h = ['Metrica', 'Castellana', 'Bocagrande', 'Total']
        vp = ventas_parsed
        biz_r = [
            ['Ventas Realizadas', f_cur(vp.get('castellana_ventas', 0)), f_cur(vp.get('bocagrande_ventas', 0)), f_cur(vp.get('total_ventas', 0))],
            ['Meta de Ventas', f_cur(vp.get('castellana_meta', 150000000)), f_cur(vp.get('bocagrande_meta', 150000000)), f_cur(vp.get('total_meta', 300000000))],
            ['% Cumplimiento', str(vp.get('castellana_pct', '____')) + '%', str(vp.get('bocagrande_pct', '____')) + '%', str(vp.get('total_pct', '____')) + '%'],
            ['Pacientes Nuevos', str(vp.get('castellana_nuevos', '____')), str(vp.get('bocagrande_nuevos', '____')), str(vp.get('total_nuevos', '____'))],
        ]
        elements.append(data_table(biz_h, biz_r, [2*inch, 1.5*inch, 1.5*inch, 1.5*inch]))
    else:
        elements.append(Paragraph('Esta seccion refleja los resultados reportados por el cliente:', styles['BodyText']))
        elements.append(Spacer(1, 6))
        biz_h = ['Metrica', 'Castellana', 'Bocagrande', 'Total']
        biz_r = [
            ['Ventas Realizadas', '____', '____', '____'],
            ['Meta de Ventas', '$150,000,000', '$150,000,000', '$300,000,000'],
            ['% Cumplimiento', '____%', '____%', '____%'],
            ['Pacientes Nuevos', '____', '____', '____'],
        ]
        elements.append(data_table(biz_h, biz_r, [2*inch, 1.5*inch, 1.5*inch, 1.5*inch]))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph('* Datos a completar por el cliente para calcular ROAS real', styles['SmallText']))

    # === INSIGHTS ===
    elements.append(Paragraph('INSIGHTS Y APRENDIZAJES', styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))

    # Best CPR by sede
    for sede_name, camps in [('Castellana', castellana_camps), ('Bocagrande', bocagrande_camps)]:
        msg_c = [c for c in camps if classify_type(c['name']) == 'Mensajes' and c.get('conversations', 0) > 0]
        if msg_c:
            best = min(msg_c, key=lambda c: c['spend']/c['conversations'])
            cpr = best['spend'] / best['conversations']
            elements.append(insight_box(
                'Mejor CPR ' + sede_name + ': ' + clean_name(best['name'])[:35],
                f_cur(cpr) + ' COP por conversacion, ' + str(int(best['conversations'])) + ' conversaciones con ' + f_cur(best['spend']) + ' COP.',
                styles, bg=PASTEL_GREEN))
            elements.append(Spacer(1, 6))

    elements.append(insight_box(
        str(int(total_first)) + ' contactos nuevos por WhatsApp',
        'Castellana: ' + str(cast_totals['first']) + ' contactos | Bocagrande: ' + str(boca_totals['first']) + ' contactos. Inversion en mensajes: ' + f_cur(msg_spend) + ' COP (' + str(int(msg_pct)) + '%).',
        styles, bg=PASTEL_BLUE))
    elements.append(Spacer(1, 6))

    if total_spend - msg_spend > 0:
        elements.append(insight_box(
            'Reconocimiento y trafico complementan el embudo',
            f_cur(total_spend - msg_spend) + ' COP (' + str(int(100 - msg_pct)) + '%) en campanas de reconocimiento y trafico.',
            styles, bg=PASTEL_YELLOW))
        elements.append(Spacer(1, 6))

    # Recomendaciones
    elements.append(Spacer(1, 8))
    elements.append(Paragraph('RECOMENDACIONES PROXIMO MES', styles['SectionTitle']))
    elements.append(SectionBar())
    elements.append(Spacer(1, 6))
    recs = [
        'Distribuir mejor el presupuesto entre Castellana y Bocagrande para equilibrar resultados en ambas sedes.',
        'Crear diferentes angulos de videos creativos para no cansar a la audiencia con los mismos videos. Testimonios, antes/despues, proceso del tratamiento, tips de cuidado.',
        'Responder los mensajes de WhatsApp en menos de 5 minutos. Cada minuto de demora reduce la conversion.',
        'Compartir testimonios y fotos/videos de clientes reales para generar confianza y reducir el costo de adquisicion.',
        'Reportar ventas cerradas para calcular el retorno real de la inversion (ROAS) y optimizar campanas.',
        'Diversificar servicios en Castellana: Tensamax tiene oportunidad significativa vs Bocagrande.',
    ]
    rec_els = []
    for i, r in enumerate(recs, 1):
        rec_els.append([Paragraph('<b>' + str(i) + '.</b>  ' + r, styles['RecText'])])
    rt = Table(rec_els, colWidths=[PAGE_WIDTH - 2*MARGIN])
    rt.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1), PASTEL_YELLOW), ('BOX',(0,0),(-1,-1), 1, CORP_BLUE),
        ('LEFTPADDING',(0,0),(-1,-1), 12), ('RIGHTPADDING',(0,0),(-1,-1), 12),
        ('TOPPADDING',(0,0),(0,0), 10), ('BOTTOMPADDING',(-1,-1),(-1,-1), 10)]))
    elements.append(rt)

    # === CLOSING ===
    elements.append(PageBreak())
    elements.append(Spacer(1, 2.2*inch))
    cs = ParagraphStyle('closing', fontSize=16, textColor=CORP_BLUE_DARK, alignment=TA_CENTER, spaceBefore=20, spaceAfter=20)
    elements.append(Paragraph('Gracias por confiar en nosotros!', cs))
    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph('Tienes preguntas sobre este reporte?', ParagraphStyle('q', fontSize=12, textColor=CORP_TEXT, alignment=TA_CENTER)))
    ct = ParagraphStyle('ct', fontSize=13, textColor=CORP_BLUE, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceBefore=8)
    elements.append(Paragraph('+57 300 7189383', ct))
    elements.append(Paragraph('dtgrowthpartners.com', ct))
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph('Impulsamos crecimiento con estrategia, tecnologia y ejecucion.', ParagraphStyle('sl', fontSize=13, textColor=CORP_TEXT_LIGHT, alignment=TA_CENTER)))

    # Build
    doc = ReportPDF(OUTPUT_PATH, client_name=CLIENT_NAME, month=MONTH, year=YEAR,
        pagesize=letter, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN + 0.3*inch, bottomMargin=MARGIN)
    doc.build(elements)
    print('OK:' + OUTPUT_PATH, file=sys.stderr)


if __name__ == '__main__':
    main()
