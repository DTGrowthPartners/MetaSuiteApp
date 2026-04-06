#!/usr/bin/env python3
"""
Meta Ads Monthly Report Generator v4.0
DT Growth Partners — Reportes PDF premium con membretes
Cambiar CLIENT_NAME, MONTH, YEAR, CSV_PATH abajo para cada cliente.
"""

import os
import sys
import shutil
import pandas as pd
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, BaseDocTemplate, PageTemplate, Frame,
    NextPageTemplate, Flowable
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Line, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.textlabels import Label
from reportlab.graphics import renderPDF

# ============================================================================
# BRAND COLORS — CORPORATIVOS REALES (from membrete pixel sampling)
# ============================================================================
CORP_BLUE = HexColor("#105F9A")        # Azul corporativo real (del membrete)
CORP_BLUE_DARK = HexColor("#0D4F82")   # Azul oscuro para títulos
CORP_GRAY = HexColor("#6B7B8D")        # Gris del logo "PARTNERS"
CORP_TEAL = HexColor("#2D8A9B")        # Teal secundario (subtítulos)
CORP_ACCENT_BG = HexColor("#EBF3F9")   # Azul muy claro para fondos
CORP_TEXT = HexColor("#2C3E50")        # Texto principal (casi negro)
CORP_TEXT_LIGHT = HexColor("#7F8C8D")  # Texto secundario
CORP_SUCCESS = HexColor("#27AE60")     # Verde
CORP_DANGER = HexColor("#E74C3C")      # Rojo
CORP_LINE = HexColor("#9F9E9C")        # Gris de la línea del membrete

# Pastel palette for visual hierarchy
PASTEL_RED = HexColor("#FFEAE6")       # Alertas, peor rendimiento
PASTEL_YELLOW = HexColor("#FFF1CC")    # Observaciones, acciones
PASTEL_GREEN = HexColor("#DAF2C2")     # Positivo, mejor rendimiento
PASTEL_BLUE = HexColor("#CFE9FE")      # Volumen, alcance, neutro

PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.75 * inch

ASSETS_DIR = '/mnt/skills/user/meta-ads-monthly-report/assets/brand'
MEMBRETE_PORTADA = os.path.join(ASSETS_DIR, 'membrete_portada.jpeg')
MEMBRETE_CONTENIDO = os.path.join(ASSETS_DIR, 'membrete_contenido.jpeg')

# ============================================================================
# CUSTOM FLOWABLE: Horizontal Bar Chart
# ============================================================================

class CampaignBarChart(Flowable):
    """Bar chart showing campaign CPR comparison"""
    
    def __init__(self, campaign_data, width=6.5*inch, height=2.8*inch):
        Flowable.__init__(self)
        self.campaign_data = campaign_data
        self.width = width
        self.height = height
    
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)
    
    def draw(self):
        c = self.canv
        
        # Filter to message campaigns only and sort by CPR
        msg_camps = [d for d in self.campaign_data if d.get('cpr', 0) > 100]
        msg_camps.sort(key=lambda x: x['cpr'])
        
        if not msg_camps:
            return
        
        # Chart dimensions
        chart_left = 2.2 * inch
        chart_bottom = 0.3 * inch
        chart_width = self.width - chart_left - 0.3 * inch
        chart_height = self.height - 0.6 * inch
        bar_height = min(0.32 * inch, chart_height / len(msg_camps) * 0.7)
        spacing = chart_height / len(msg_camps)
        
        max_cpr = max(d['cpr'] for d in msg_camps) * 1.15
        
        # Title
        c.saveState()
        c.setFont('Helvetica-Bold', 9)
        c.setFillColor(CORP_BLUE_DARK)
        c.drawString(0, self.height - 0.15 * inch, "COSTO POR CONVERSACIÓN (COP)")
        c.restoreState()
        
        # Draw bars
        for i, camp in enumerate(msg_camps):
            y = chart_bottom + (len(msg_camps) - 1 - i) * spacing
            bar_width = (camp['cpr'] / max_cpr) * chart_width
            
            # Campaign label (truncated)
            c.saveState()
            name = camp['name']
            # Clean emoji prefixes for readability
            import re
            name = re.sub(r'^[^\x00-\x7F]+\s*DTGP\s*-\s*', '', name)
            name = name.strip()
            if len(name) > 28:
                name = name[:26] + '...'
            
            c.setFont('Helvetica', 7.5)
            c.setFillColor(CORP_TEXT)
            c.drawRightString(chart_left - 0.1 * inch, y + bar_height/2 - 3, name)
            
            # Bar
            # Color gradient: best CPR = green-ish, worst = blue
            ratio = i / max(len(msg_camps) - 1, 1)
            r = int(16 + ratio * 20)
            g = int(155 - ratio * 60)
            b = int(120 + ratio * 34)
            bar_color = Color(r/255, g/255, b/255)
            
            c.setFillColor(CORP_BLUE)
            c.roundRect(chart_left, y, bar_width, bar_height, 3, fill=1, stroke=0)
            
            # Value label
            c.setFont('Helvetica-Bold', 7.5)
            c.setFillColor(CORP_TEXT)
            c.drawString(chart_left + bar_width + 4, y + bar_height/2 - 3,
                        f"${camp['cpr']:,.0f}")
            
            # Conversations count
            c.setFont('Helvetica', 6.5)
            c.setFillColor(CORP_TEXT_LIGHT)
            c.drawString(chart_left + bar_width + 4, y + bar_height/2 - 12,
                        f"({int(camp['convos'])} conv.)")
            
            c.restoreState()


class SectionBar(Flowable):
    """Short blue accent bar for section headers"""
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


class InvestmentPieVisual(Flowable):
    """Simple visual showing budget distribution"""
    
    def __init__(self, msg_pct, awareness_pct, msg_spend, awareness_spend, width=6.5*inch, height=1.2*inch):
        Flowable.__init__(self)
        self.msg_pct = msg_pct
        self.awareness_pct = awareness_pct
        self.msg_spend = msg_spend
        self.awareness_spend = awareness_spend
        self.width = width
        self.height = height
    
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)
    
    def draw(self):
        c = self.canv
        bar_y = 0.55 * inch
        bar_height = 0.28 * inch
        total_width = self.width - 0.2 * inch
        
        # Title
        c.setFont('Helvetica-Bold', 9)
        c.setFillColor(CORP_BLUE_DARK)
        c.drawString(0, self.height - 0.15 * inch, "DISTRIBUCIÓN DE INVERSIÓN")
        
        # Messages bar
        msg_width = total_width * (self.msg_pct / 100)
        c.setFillColor(CORP_BLUE)
        c.roundRect(0, bar_y, msg_width, bar_height, 4, fill=1, stroke=0)
        
        # Awareness bar
        c.setFillColor(HexColor("#B0C4DE"))
        c.roundRect(msg_width + 2, bar_y, total_width - msg_width - 2, bar_height, 4, fill=1, stroke=0)
        
        # Labels
        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(white)
        if msg_width > 1.5 * inch:
            c.drawString(0.15*inch, bar_y + bar_height/2 - 3,
                        f"Mensajes/Leads: {self.msg_pct:.0f}%")
        
        # Legend below
        c.setFont('Helvetica', 7.5)
        c.setFillColor(CORP_TEXT)
        c.drawString(0, 0.15*inch,
                    f"● Campañas de Mensajes: ${self.msg_spend:,.0f} COP ({self.msg_pct:.0f}%)")
        c.setFillColor(CORP_TEXT_LIGHT)
        c.drawString(3.2*inch, 0.15*inch,
                    f"● Reconocimiento/Tráfico: ${self.awareness_spend:,.0f} COP ({self.awareness_pct:.0f}%)")


# ============================================================================
# STYLES
# ============================================================================

def get_styles():
    styles = getSampleStyleSheet()
    
    def safe_add(style):
        if style.name in styles.byName:
            styles.byName[style.name] = style
        else:
            styles.add(style)
    
    safe_add(ParagraphStyle('CoverTitle', fontSize=28, textColor=CORP_BLUE_DARK,
        alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4, leading=34))
    safe_add(ParagraphStyle('CoverSubtitle', fontSize=18, textColor=CORP_GRAY,
        alignment=TA_CENTER, spaceAfter=20))
    safe_add(ParagraphStyle('CoverClient', fontSize=24, textColor=CORP_BLUE_DARK,
        alignment=TA_CENTER, fontName='Helvetica-Bold'))
    safe_add(ParagraphStyle('CoverPrepLabel', fontSize=11, textColor=CORP_TEXT_LIGHT,
        alignment=TA_CENTER, spaceAfter=6))
    safe_add(ParagraphStyle('CoverPrepName', fontSize=15, textColor=CORP_BLUE_DARK,
        alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4))
    safe_add(ParagraphStyle('CoverContact', fontSize=11, textColor=CORP_GRAY,
        alignment=TA_CENTER))
    
    safe_add(ParagraphStyle('SectionTitle', parent=styles['Heading2'],
        fontSize=19, textColor=CORP_BLUE_DARK, spaceBefore=14, spaceAfter=8,
        fontName='Helvetica-Bold'))
    safe_add(ParagraphStyle('SubSection', parent=styles['Heading3'],
        fontSize=13, textColor=CORP_TEAL, spaceBefore=12, spaceAfter=6,
        fontName='Helvetica-Bold'))
    safe_add(ParagraphStyle('BodyText', parent=styles['Normal'],
        fontSize=12, textColor=CORP_TEXT, spaceAfter=8, leading=16))
    safe_add(ParagraphStyle('SmallText', parent=styles['Normal'],
        fontSize=10, textColor=CORP_TEXT_LIGHT, spaceAfter=4, leading=13))
    safe_add(ParagraphStyle('InsightTitle', fontSize=13, textColor=CORP_BLUE_DARK,
        fontName='Helvetica-Bold', spaceAfter=3))
    safe_add(ParagraphStyle('InsightBody', fontSize=11, textColor=CORP_TEXT,
        leading=15, spaceAfter=2))
    safe_add(ParagraphStyle('RecText', fontSize=12, textColor=CORP_TEXT,
        leftIndent=15, spaceBefore=6, spaceAfter=6, leading=16))
    
    return styles


# ============================================================================
# PDF TEMPLATE WITH MEMBRETES
# ============================================================================

class ReportPDF(BaseDocTemplate):
    def __init__(self, filename, client_name, month, year, **kwargs):
        self.client_name = client_name
        self.month = month
        self.year = year
        BaseDocTemplate.__init__(self, filename, **kwargs)
        
        # Cover frame - content starts BELOW the blue header (header ~1.3 inches)
        cover_frame = Frame(
            MARGIN, MARGIN,
            PAGE_WIDTH - 2*MARGIN,
            PAGE_HEIGHT - 2*MARGIN - 1.0*inch,  # Leave space for blue header
            id='cover'
        )
        
        # Content frame - below the logo/line header (~1.2 inches top)
        content_frame = Frame(
            MARGIN, 0.95*inch,  # Footer space
            PAGE_WIDTH - 2*MARGIN,
            PAGE_HEIGHT - MARGIN - 0.35*inch - 0.95*inch,  # Top header + bottom footer
            id='content'
        )
        
        self.addPageTemplates([
            PageTemplate(id='cover', frames=[cover_frame], onPage=self._draw_cover),
            PageTemplate(id='content', frames=[content_frame], onPage=self._draw_content),
        ])
    
    def _draw_cover(self, canvas, doc):
        """Portada: membrete azul como fondo. NO agregar logo extra."""
        if os.path.exists(MEMBRETE_PORTADA):
            canvas.drawImage(MEMBRETE_PORTADA, 0, 0,
                width=PAGE_WIDTH, height=PAGE_HEIGHT,
                preserveAspectRatio=False, mask='auto')
            # Cover the membrete footer (slogan + contact info)
            canvas.saveState()
            canvas.setFillColor(white)
            canvas.rect(0, 0, PAGE_WIDTH, 1.65 * inch, fill=1, stroke=0)
            canvas.restoreState()
    
    def _draw_content(self, canvas, doc):
        """Contenido: membrete blanco + header con cliente + footer profesional"""
        if os.path.exists(MEMBRETE_CONTENIDO):
            canvas.drawImage(MEMBRETE_CONTENIDO, 0, 0,
                width=PAGE_WIDTH, height=PAGE_HEIGHT,
                preserveAspectRatio=False, mask='auto')
        
        canvas.saveState()
        
        # --- REPLACE gray line with corporate blue line ---
        header_line_y = PAGE_HEIGHT - 1.16 * inch
        # Cover original gray line
        canvas.setFillColor(white)
        canvas.rect(0, header_line_y - 4, PAGE_WIDTH, 10, fill=1, stroke=0)
        # Draw corporate blue line
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, header_line_y, PAGE_WIDTH - MARGIN, header_line_y)
        
        # --- Client name in header (right side) ---
        canvas.setFont('Helvetica', 9.5)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawRightString(
            PAGE_WIDTH - MARGIN,
            header_line_y + 8,
            f"{self.client_name}  |  {self.month} {self.year}"
        )
        
        # --- FOOTER: cover original membrete footer completely ---
        canvas.setFillColor(white)
        canvas.rect(0, 0, PAGE_WIDTH, 0.95 * inch, fill=1, stroke=0)
        
        # New footer: separator line + confidential text + page number
        footer_y = 0.55 * inch
        canvas.setStrokeColor(CORP_BLUE)
        canvas.setLineWidth(0.75)
        canvas.line(MARGIN, footer_y + 12, PAGE_WIDTH - MARGIN, footer_y + 12)
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(CORP_GRAY)
        canvas.drawString(MARGIN, footer_y - 2,
            f"Informe confidencial  —  {self.client_name}  |  {self.month} {self.year}")
        canvas.drawRightString(PAGE_WIDTH - MARGIN, footer_y - 2,
            f"Página {canvas.getPageNumber()}")
        
        canvas.restoreState()


# ============================================================================
# COMPONENT BUILDERS
# ============================================================================

def metric_box(value, label, width=1.65*inch, bg_color=None):
    """Single metric card"""
    if bg_color is None:
        bg_color = PASTEL_BLUE
    val_style = ParagraphStyle('mv', fontSize=22, textColor=CORP_BLUE_DARK,
        alignment=TA_CENTER, fontName='Helvetica-Bold', leading=26)
    lbl_style = ParagraphStyle('ml', fontSize=10, textColor=CORP_TEXT_LIGHT,
        alignment=TA_CENTER, leading=13)
    
    content = [[Paragraph(value, val_style)], [Spacer(1, 4)], [Paragraph(label, lbl_style)]]
    inner = Table(content, colWidths=[width])
    inner.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    outer = Table([[inner]], colWidths=[width], rowHeights=[85])
    outer.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 0.75, CORP_BLUE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    return outer


def metrics_row(items):
    """Row of metric boxes"""
    boxes = [metric_box(m['value'], m['label'], bg_color=m.get('bg')) for m in items]
    col_w = (PAGE_WIDTH - 2*MARGIN) / len(boxes)
    t = Table([boxes], colWidths=[col_w]*len(boxes))
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('ALIGN',(0,0),(-1,-1),'CENTER')]))
    return t


def data_table(headers, rows, col_widths=None):
    """Styled data table"""
    data = [headers] + rows
    if not col_widths:
        col_widths = [(PAGE_WIDTH - 2*MARGIN) / len(headers)] * len(headers)
    
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), CORP_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 11),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 10),
        ('ALIGN', (0,1), (-1,-1), 'CENTER'),
        ('ALIGN', (0,1), (0,-1), 'LEFT'),  # Campaign names left-aligned
        ('VALIGN', (0,1), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('TOPPADDING', (0,1), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, CORP_ACCENT_BG]),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor("#BDC3C7")),
    ]))
    return t


def insight_box(icon, title, content, styles, bg_color=None):
    """Insight card with colored accent"""
    if bg_color is None:
        bg_color = PASTEL_BLUE
    data = [
        [Paragraph(f"<b>{title}</b>", styles['InsightTitle'])],
        [Paragraph(content, styles['InsightBody'])],
    ]
    t = Table(data, colWidths=[PAGE_WIDTH - 2*MARGIN])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 1.5, CORP_BLUE),
        ('LINEBEFOREDECVAL', (0,0), (0,-1), 4),
        ('LINEBEFORE', (0,0), (0,-1), 4, CORP_BLUE),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return t


def fmt_currency(v):
    return f"${v:,.0f}"

def fmt_number(v):
    if v >= 1000000: return f"{v/1000000:.1f}M"
    if v >= 1000: return f"{v/1000:.1f}K"
    return f"{v:,.0f}"


# ============================================================================
# PROCESS CSV
# ============================================================================

# ============================================================================
# ⚡ CONFIGURACIÓN — CAMBIAR ESTOS 4 VALORES PARA CADA CLIENTE
# ============================================================================
CLIENT_NAME = "Gimnasio ACBfit"
MONTH = "Marzo"
YEAR = "2026"
CSV_PATH = "/mnt/user-data/uploads/INFORME-MARZO-2026_.csv"
# ============================================================================

csv_path = CSV_PATH
df = pd.read_csv(csv_path)

num_map = {
    'Importe gastado (COP)': 'spend', 'Alcance': 'reach',
    'Impresiones': 'impressions', 'Resultados': 'results',
    'Costo por resultado': 'cpr', 'Clics en el enlace': 'link_clicks',
    'Nuevos contactos de mensajes': 'new_contacts',
    'Conversaciones con mensajes iniciadas': 'conversations',
}
for orig, new in num_map.items():
    if orig in df.columns:
        df[new] = pd.to_numeric(df[orig].astype(str).str.replace(',',''), errors='coerce').fillna(0)

df['campaign'] = df['Nombre de la campaña']
df['result_type'] = df['Tipo de resultado']

# Aggregate by campaign
cg = df.groupby('campaign').agg({
    'spend':'sum', 'results':'sum', 'reach':'sum', 'impressions':'sum',
    'new_contacts':'sum', 'conversations':'sum', 'result_type':'first',
    'link_clicks':'sum',
}).reset_index()

# Separate by type
msg_mask = cg['result_type'] == 'Conversaciones con mensajes iniciadas'
msg_camps = cg[msg_mask].copy()
other_camps = cg[~msg_mask].copy()

# Key metrics
total_spend = df['spend'].sum()
total_reach = df['reach'].sum()
total_impressions = df['impressions'].sum()
total_link_clicks = df['link_clicks'].sum()

msg_spend = msg_camps['spend'].sum()
msg_convos = msg_camps['conversations'].sum()
msg_new_contacts = msg_camps['new_contacts'].sum()
msg_cpr = msg_spend / msg_convos if msg_convos > 0 else 0

awareness_spend = other_camps['spend'].sum()
awareness_results = other_camps['results'].sum()

msg_camps['cpr_conv'] = msg_camps.apply(
    lambda r: r['spend']/r['conversations'] if r['conversations']>0 else 0, axis=1)
best_camp = msg_camps.loc[msg_camps['cpr_conv'].idxmin()].copy()
top_vol_camp = msg_camps.loc[msg_camps['conversations'].idxmax()].copy()

# Clean emoji prefixes from campaign names
import re
def clean_camp_name(name):
    return re.sub(r'^[^\x00-\x7F]+\s*DTGP\s*-\s*', '', str(name)).strip()

best_camp['campaign'] = clean_camp_name(best_camp['campaign'])
top_vol_camp['campaign'] = clean_camp_name(top_vol_camp['campaign'])

# ============================================================================
# BUILD REPORT
# ============================================================================

styles = get_styles()
elements = []

# === PAGE 1: COVER ===
elements.append(Spacer(1, 0.6*inch))  # Below blue header (already has logo)

elements.append(Spacer(1, 0.6*inch))
elements.append(Paragraph("INFORME DE RESULTADOS", styles['CoverTitle']))
elements.append(Spacer(1, 6))

# Meta Ads tag
meta_tag_style = ParagraphStyle('MetaTag', fontSize=14, textColor=CORP_GRAY,
    alignment=TA_CENTER, fontName='Helvetica', spaceBefore=0, spaceAfter=0,
    leading=14)
elements.append(Paragraph(f"Meta Ads  |  {MONTH} {YEAR}", meta_tag_style))

# Decorative blue line
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

# Switch to content template
elements.append(NextPageTemplate('content'))
elements.append(PageBreak())

# === PAGE 2: RESUMEN EJECUTIVO ===
elements.append(Paragraph("RESUMEN EJECUTIVO", styles['SectionTitle']))
elements.append(SectionBar())
elements.append(Spacer(1, 10))

row1 = [
    {'value': f"${total_spend/1000000:.1f}M", 'label': 'INVERSIÓN TOTAL', 'bg': PASTEL_BLUE},
    {'value': fmt_number(msg_convos), 'label': 'CONVERSACIONES WP', 'bg': PASTEL_GREEN},
    {'value': fmt_currency(msg_cpr), 'label': 'COSTO POR CONVERSACIÓN', 'bg': PASTEL_YELLOW},
    {'value': fmt_number(msg_new_contacts), 'label': 'CONTACTOS NUEVOS', 'bg': PASTEL_GREEN},
]
elements.append(metrics_row(row1))
elements.append(Spacer(1, 8))

row2 = [
    {'value': fmt_number(total_reach), 'label': 'ALCANCE TOTAL', 'bg': PASTEL_BLUE},
    {'value': fmt_number(total_impressions), 'label': 'IMPRESIONES', 'bg': PASTEL_BLUE},
    {'value': fmt_number(total_link_clicks), 'label': 'CLICS EN ENLACE', 'bg': PASTEL_BLUE},
    {'value': f"{msg_spend/total_spend*100:.0f}%", 'label': 'INVERSIÓN EN MENSAJES', 'bg': PASTEL_YELLOW},
]
elements.append(metrics_row(row2))
elements.append(Spacer(1, 18))

# Narrative summary
summary_text = (
    f'Durante {MONTH.lower()} {YEAR}, se invirtieron <b>{fmt_currency(total_spend)} COP</b> en campañas de Meta Ads '
    f'para {CLIENT_NAME}. Las campañas de mensajes representaron el <b>{msg_spend/total_spend*100:.0f}%</b> '
    f'de la inversión y generaron <b>{int(msg_convos)} conversaciones de WhatsApp</b>, de las cuales '
    f'<b>{int(msg_new_contacts)}</b> fueron contactos completamente nuevos. '
    f'El costo promedio por conversación fue de <b>{fmt_currency(msg_cpr)} COP</b>. '
    f'En total, las campañas alcanzaron a <b>{fmt_number(total_reach)} personas</b> con '
    f'<b>{fmt_number(total_impressions)} impresiones</b>.'
)
elements.append(Paragraph(summary_text, styles['BodyText']))

elements.append(Spacer(1, 8))
result_text = (
    f'La campaña con mejor rendimiento fue <b>{best_camp["campaign"]}</b> con un costo por conversación de '
    f'<b>{fmt_currency(best_camp["cpr_conv"])} COP</b>, mientras que <b>{top_vol_camp["campaign"]}</b> fue la de mayor '
    f'volumen con <b>{int(top_vol_camp["conversations"])} conversaciones</b> generadas.'
)
elements.append(Paragraph(result_text, styles['BodyText']))

elements.append(PageBreak())

# === PAGE 3: RENDIMIENTO POR CAMPAÑA + RESULTADOS DE NEGOCIO ===
elements.append(Paragraph("RENDIMIENTO POR CAMPAÑA", styles['SectionTitle']))
elements.append(SectionBar())
elements.append(Spacer(1, 6))

# Build campaign table — sorted by type then spend (descending)
headers = ['Campaña', 'Tipo', 'Inversión', 'Resultados', 'CPR', 'Alcance']
rows = []
row_cprs = []  # Track CPR per row for coloring

# Type priority order
type_order = {
    'Conversaciones con mensajes iniciadas': 0,  # Mensajes first
    'ThruPlay': 1,
    'Visitas al perfil de Instagram': 2,
    'Clics en el enlace': 3,
}
cg['type_order'] = cg['result_type'].map(type_order).fillna(9)
cg_sorted = cg.sort_values(['type_order', 'spend'], ascending=[True, False])

for _, r in cg_sorted.iterrows():
    name = r['campaign']
    # Strip emoji color prefixes and DTGP prefix
    import re
    name = re.sub(r'^[^\x00-\x7F]+\s*DTGP\s*-\s*', '', name)
    name = name.strip()
    if len(name) > 25:
        name = name[:23] + '..'
    
    # Type label
    type_labels = {
        'Conversaciones con mensajes iniciadas': 'Mensajes',
        'ThruPlay': 'Video',
        'Visitas al perfil de Instagram': 'Tráfico IG',
        'Clics en el enlace': 'Clics',
    }
    tipo = type_labels.get(r['result_type'], r['result_type'][:12])
    
    # Use conversations for message campaigns, actual results for others
    is_msg = r['result_type'] == 'Conversaciones con mensajes iniciadas'
    res = int(r['conversations']) if is_msg else int(r['results'])
    cpr = r['spend']/res if res > 0 else 0
    
    rows.append([
        name, tipo, fmt_currency(r['spend']),
        fmt_number(res), fmt_currency(cpr), fmt_number(r['reach'])
    ])
    row_cprs.append((cpr, is_msg))

col_w = [2.2*inch, 0.75*inch, 0.85*inch, 0.8*inch, 0.8*inch, 0.7*inch]

# Build table manually (no alternating rows, so pastel colors show)
data = [headers] + rows
camp_table = Table(data, colWidths=col_w)

# Base style
base_style = [
    ('BACKGROUND', (0,0), (-1,0), CORP_BLUE),
    ('TEXTCOLOR', (0,0), (-1,0), white),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 11),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('TOPPADDING', (0,0), (-1,0), 8),
    ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
    ('FONTSIZE', (0,1), (-1,-1), 10),
    ('ALIGN', (0,1), (-1,-1), 'CENTER'),
    ('ALIGN', (0,1), (0,-1), 'LEFT'),
    ('VALIGN', (0,1), (-1,-1), 'MIDDLE'),
    ('BOTTOMPADDING', (0,1), (-1,-1), 6),
    ('TOPPADDING', (0,1), (-1,-1), 6),
    ('GRID', (0,0), (-1,-1), 0.5, HexColor("#BDC3C7")),
]

# Apply alternating white/light-blue BUT override best/worst rows
for i in range(len(rows)):
    row_idx = i + 1  # +1 for header
    bg = white if i % 2 == 0 else PASTEL_BLUE
    base_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))

# Color-code best/worst CPR rows (only among message campaigns)
msg_cprs = [(i, cpr) for i, (cpr, is_msg) in enumerate(row_cprs) if is_msg and cpr > 0]
if msg_cprs:
    best_idx = min(msg_cprs, key=lambda x: x[1])[0]
    worst_idx = max(msg_cprs, key=lambda x: x[1])[0]
    base_style.append(('BACKGROUND', (0, best_idx+1), (-1, best_idx+1), PASTEL_GREEN))
    base_style.append(('BACKGROUND', (0, worst_idx+1), (-1, worst_idx+1), PASTEL_RED))

camp_table.setStyle(TableStyle(base_style))
elements.append(camp_table)

elements.append(Spacer(1, 20))

# Business results section
elements.append(Paragraph("RESULTADOS DE NEGOCIO", styles['SectionTitle']))
elements.append(SectionBar())
elements.append(Paragraph(
    "Esta sección refleja los resultados de negocio reportados por el cliente:",
    styles['BodyText']
))
elements.append(Spacer(1, 6))

biz_headers = ['Métrica', 'Cantidad', 'Valor Estimado']
biz_rows = [
    ['Clientes Generados (Ventas Cerradas)', '____', '$____'],
    ['Clientes Potenciales (En Negociación)', '____', '$____'],
    ['Tickets / Cotizaciones', '____', '$____'],
]
biz_widths = [3.2*inch, 1.4*inch, 1.5*inch]
elements.append(data_table(biz_headers, biz_rows, biz_widths))
elements.append(Spacer(1, 4))
elements.append(Paragraph(
    "* Datos a completar por el cliente para calcular ROAS real",
    styles['SmallText']
))

elements.append(PageBreak())

# === PAGE 4: INSIGHTS + RECOMENDACIONES ===
elements.append(Paragraph("INSIGHTS Y APRENDIZAJES", styles['SectionTitle']))
elements.append(SectionBar())
elements.append(Spacer(1, 6))

insights = [
    ('>', f'Mejor CPR: {best_camp["campaign"][:40]}',
     f'Menor costo por conversación del mes a ${best_camp["cpr_conv"]:,.0f} COP, '
     f'generando {int(best_camp["conversations"])} conversaciones de WhatsApp con '
     f'${best_camp["spend"]:,.0f} COP de inversión.',
     PASTEL_GREEN),
    
    ('>', f'Mayor volumen: {top_vol_camp["campaign"][:40]}',
     f'Líder en volumen con {int(top_vol_camp["conversations"])} conversaciones y '
     f'{int(top_vol_camp["new_contacts"])} contactos nuevos. '
     f'CPR: ${top_vol_camp["cpr_conv"]:,.0f} COP.',
     PASTEL_GREEN),
    
    ('>', f'{int(msg_new_contacts)} contactos nuevos por WhatsApp',
     f'Las campañas de mensajes generaron {int(msg_convos)} conversaciones y {int(msg_new_contacts)} '
     f'contactos nuevos. Inversión en mensajes: ${msg_spend:,.0f} COP ({msg_spend/total_spend*100:.0f}%). '
     f'CPR promedio: ${msg_cpr:,.0f} COP.',
     PASTEL_BLUE),
    
    ('>', 'Reconocimiento y tráfico complementan el embudo',
     f'${awareness_spend:,.0f} COP ({awareness_spend/total_spend*100:.0f}%) en campañas de video (ThruPlay) '
     f'y tráfico a Instagram generaron {int(awareness_results):,} impactos de marca.',
     PASTEL_YELLOW),
]

for icon, title, content, color in insights:
    elements.append(insight_box(icon, title, content, styles, bg_color=color))
    elements.append(Spacer(1, 6))

elements.append(Spacer(1, 10))
elements.append(Paragraph("RECOMENDACIONES PRÓXIMO MES", styles['SectionTitle']))
elements.append(SectionBar())
elements.append(Spacer(1, 6))

recommendations = [
    'Preparar promociones o planes especiales para abril que podamos impulsar '
    f'con las campañas de WhatsApp — los resultados de {MONTH.lower()} muestran que los contactos '
    'llegan, el siguiente paso es tener ofertas atractivas listas.',
    
    'Responder los mensajes de WhatsApp lo más rápido posible (idealmente en menos de 5 minutos). '
    'Cada minuto de demora reduce la probabilidad de convertir ese contacto en cliente.',
    
    'Compartir testimonios y fotos/videos de clientes reales — este tipo de contenido '
    'genera más confianza y reduce el costo de adquisición.',
    
    'Reportar las ventas cerradas del mes para calcular el retorno real de la inversión (ROAS) '
    'y optimizar las campañas según lo que más genera ingresos.',
]

# Build recommendations as a single yellow container
rec_elements = []
for i, rec in enumerate(recommendations, 1):
    rec_elements.append([Paragraph(f"<b>{i}.</b>  {rec}", styles['RecText'])])

rec_table = Table(rec_elements, colWidths=[PAGE_WIDTH - 2*MARGIN])
rec_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), PASTEL_YELLOW),
    ('BOX', (0,0), (-1,-1), 1, CORP_BLUE),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ('TOPPADDING', (0,0), (0,0), 10),
    ('BOTTOMPADDING', (-1,-1), (-1,-1), 10),
]))
elements.append(rec_table)

# === PAGE 5: CLOSING ===
elements.append(PageBreak())
elements.append(Spacer(1, 2.2*inch))

closing_style = ParagraphStyle('closing', fontSize=16, textColor=CORP_BLUE_DARK,
    alignment=TA_CENTER, spaceBefore=20, spaceAfter=20)
elements.append(Paragraph("¡Gracias por confiar en nosotros!", closing_style))
elements.append(Spacer(1, 0.4*inch))

elements.append(Paragraph("¿Tienes preguntas sobre este reporte?",
    ParagraphStyle('q', fontSize=12, textColor=CORP_TEXT, alignment=TA_CENTER)))

contact_s = ParagraphStyle('contact', fontSize=13, textColor=CORP_BLUE,
    alignment=TA_CENTER, fontName='Helvetica-Bold', spaceBefore=8)
elements.append(Paragraph("+57 300 7189383", contact_s))
elements.append(Paragraph("dtgrowthpartners.com", contact_s))

elements.append(Spacer(1, 1*inch))
slogan_s = ParagraphStyle('slogan', fontSize=13, textColor=CORP_TEXT_LIGHT,
    alignment=TA_CENTER, fontStyle='italic')
elements.append(Paragraph("Impulsamos crecimiento con estrategia, tecnología y ejecución.", slogan_s))


# ============================================================================
# BUILD PDF
# ============================================================================

safe_name = re.sub(r'[^\w]', '_', CLIENT_NAME).strip('_')
safe_name = re.sub(r'_+', '_', safe_name)
output_path = f'/home/claude/Informe_MetaAds_{safe_name}_{MONTH}_{YEAR}.pdf'

doc = ReportPDF(
    output_path,
    client_name=CLIENT_NAME,
    month=MONTH,
    year=YEAR,
    pagesize=letter,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=MARGIN + 0.3*inch,
    bottomMargin=MARGIN,
)

doc.build(elements)
print(f"✅ Reporte generado: {output_path}")

final = f'/mnt/user-data/outputs/Informe_MetaAds_{safe_name}_{MONTH}_{YEAR}.pdf'
shutil.copy2(output_path, final)
print(f"📄 Listo: {final}")
