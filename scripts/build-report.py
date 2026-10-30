"""Genera el informe académico, su fuente editable y el diagrama vectorial."""
from pathlib import Path
import hashlib
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from reportlab.graphics import renderSVG
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
summary = json.loads((ROOT / 'evidencias/resumen.json').read_text(encoding='utf-8'))
contract = ROOT / 'pacts/ProductConsumer-ProductProvider.json'
contract_hash = hashlib.sha256(contract.read_bytes()).hexdigest()
assert [s['exitCode'] for s in summary['steps']] == [0, 0, 1, 0]
assert all(s['contractSha256'] == contract_hash for s in summary['steps'])
for step in summary['steps']:
    assert hashlib.sha256((ROOT / f"evidencias/{step['name']}.log").read_bytes()).hexdigest() == step['logSha256']
    assert (ROOT / f"evidencias/{step['name']}.png").is_file()

repo = 'https://github.com/jefroMMM/Contract-Testing-con-Pact'
tag_url = repo + '/tree/entrega-v1.0.0'
# Guatemala tiene UTC-6 todo el año; fallback si Python no incluye tzdata en Windows.
try:
    tz = ZoneInfo('America/Guatemala')
except Exception:
    from datetime import timezone, timedelta
    tz = timezone(timedelta(hours=-6))
run_date = datetime.fromisoformat(summary['startedAt'].replace('Z', '+00:00')).astimezone(tz)
date_label = run_date.strftime('%d/%m/%Y')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom', fontName='Helvetica-Bold', fontSize=29, leading=35, textColor=colors.HexColor('#142d48'), spaceAfter=18))
styles.add(ParagraphStyle(name='SubtitleCustom', fontSize=15, leading=21, textColor=colors.HexColor('#327f91'), spaceAfter=16))
styles['Heading1'].fontSize = 20
styles['Heading1'].leading = 25
styles['Heading1'].textColor = colors.HexColor('#142d48')
styles['Heading1'].spaceAfter = 15
styles['Heading2'].fontSize = 12
styles['Heading2'].textColor = colors.HexColor('#267387')
styles['Heading2'].spaceBefore = 12
styles['Heading2'].spaceAfter = 7
styles['BodyText'].fontSize = 10.5
styles['BodyText'].leading = 15
styles['BodyText'].spaceAfter = 9
styles.add(ParagraphStyle(name='SmallCustom', fontSize=8.2, leading=11.5, textColor=colors.HexColor('#45566b'), spaceAfter=6))
styles.add(ParagraphStyle(name='CodeCustom', fontName='Courier', fontSize=8.4, leading=12, backColor=colors.HexColor('#edf3f7'), borderPadding=8, spaceBefore=7, spaceAfter=12))
story = []
md = []

def p(text, style='BodyText'):
    story.append(Paragraph(text, styles[style]))

def section(title):
    p(title, 'Heading1')
    md.append('\n## ' + title + '\n')

def para(text):
    p(escape(text))
    md.append(text + '\n')

def sub(title, text):
    p(escape(title), 'Heading2')
    para(text)

def code(text):
    p(escape(text).replace('\n', '<br/>'), 'CodeCustom')
    md.append('```sh\n' + text + '\n```\n')

def newpage():
    story.append(PageBreak())

def table(rows, widths):
    data = [[Paragraph(escape(str(c)), styles['SmallCustom']) for c in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0edf2')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#327f91')),
        ('LINEBELOW', (0, 1), (-1, -1), .3, colors.HexColor('#d6e0e8')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

def diagram():
    d = Drawing(480, 285)
    def box(x, y, lines, fill='#eaf3f6'):
        d.add(Rect(x, y, 145, 57, rx=7, ry=7, fillColor=colors.HexColor(fill), strokeColor=colors.HexColor('#327f91')))
        for i, text in enumerate(lines):
            d.add(String(x+72.5, y+36-i*15, text, textAnchor='middle', fontName='Helvetica', fontSize=10, fillColor=colors.HexColor('#142d48')))
    def arrow(x1, y1, x2, y2):
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor('#327f91'), strokeWidth=1.5))
        if y1 == y2:
            d.add(Polygon([x2,y2,x2-6,y2+3,x2-6,y2-3],fillColor=colors.HexColor('#327f91'),strokeColor=None))
        else:
            d.add(Polygon([x2,y2,x2-3,y2+6,x2+3,y2+6],fillColor=colors.HexColor('#327f91'),strokeColor=None))
    box(0,220,['Cliente real','ProductClient + HTTP'])
    box(167,220,['Servidor simulado','Pact + assertions'])
    box(334,220,['Contrato JSON','Generado por Pact'])
    arrow(145,248,167,248); arrow(312,248,334,248)
    box(334,110,['Verifier de Pact','Reproduce solicitudes'])
    arrow(406,220,406,167)
    box(167,110,['API real','GET /products/:id'])
    d.add(Line(334,138,312,138,strokeColor=colors.HexColor('#327f91'),strokeWidth=1.5))
    d.add(Polygon([312,138,318,141,318,135],fillColor=colors.HexColor('#327f91'),strokeColor=None))
    box(167,5,['Repositorio en memoria','Estados independientes'])
    arrow(239,110,239,62)
    box(0,110,['Resultado del Verifier','Compatible / mismatch'])
    d.add(Line(350,110,350,82,strokeColor=colors.HexColor('#327f91'),strokeWidth=1.5))
    d.add(Line(350,82,72,82,strokeColor=colors.HexColor('#327f91'),strokeWidth=1.5))
    d.add(Line(72,82,72,110,strokeColor=colors.HexColor('#327f91'),strokeWidth=1.5))
    d.add(Polygon([72,110,69,104,75,104],fillColor=colors.HexColor('#327f91'),strokeColor=None))
    d.add(String(0,185,'El Verifier compara la respuesta real con el contrato.',fontSize=9,fillColor=colors.HexColor('#45566b')))
    renderSVG.drawToFile(d, str(ROOT / 'docs/arquitectura.svg'))
    return d

# 1. Portada
story.append(Spacer(1, 55))
p('Universidad Mariano Gálvez<br/>de Guatemala', 'SubtitleCustom')
story.append(Spacer(1, 35))
p('Compatibilidad entre<br/>consumidor y proveedor<br/>utilizando Pact', 'TitleCustom')
p('Contract Testing con Pact · Informe académico', 'SubtitleCustom')
story.append(Spacer(1, 45))
para('Responsable: Jefry Ariel Mas Monterroso')
para('Caso de estudio: consulta de productos mediante una API HTTP en TypeScript.')
para(f'Fecha de ejecución: {date_label} · America/Guatemala.')
para('Versión de entrega: entrega-v1.0.0')
p(f'<link href="{repo}" color="#267387">Repositorio del proyecto</link>', 'BodyText')
p(f'<link href="{tag_url}" color="#267387">Código, contrato y evidencias de esta entrega</link>', 'BodyText')
story.append(Spacer(1, 42))
p('Documento generado localmente y preparado para cargar en Canvas, la plataforma educativa. No se ha realizado la carga al aula virtual.', 'SmallCustom')
md.insert(0, '# Compatibilidad entre consumidor y proveedor utilizando Pact\n\nUniversidad Mariano Gálvez de Guatemala\n\n')
newpage()

# 2. Contexto y justificación
section('1. Introducción y contexto del caso')
para('Cuando dos aplicaciones se comunican, una respuesta HTTP exitosa no garantiza que ambas interpreten los datos de la misma manera. Un campo puede conservar su nombre y cambiar de tipo, provocando un error en el consumidor. Las pruebas de contrato permiten expresar las expectativas del consumidor y comprobarlas contra el proveedor.')
para('El objetivo de este proyecto es comprobar de forma reproducible la compatibilidad de un consumidor de productos con su API proveedora. Se implementaron ambas partes en TypeScript y se utilizó Pact JS para generar y verificar un contrato local, sin depender de un Broker ni de servicios pagados.')
sub('Interacción 1: producto existente', 'Precondición: existe p-100 en el catálogo. Solicitud: GET /products/p-100 con Accept: application/json. Respuesta: HTTP 200 y un producto con id p-100, name de texto, price decimal y available booleano. El consumidor devuelve kind: found y valida los tipos antes de utilizar los datos. Esta interacción representa el flujo principal de consulta.')
sub('Interacción 2: producto inexistente', 'Precondición: el catálogo no contiene p-404. Solicitud: GET /products/p-404. Respuesta: HTTP 404 con error.code igual a PRODUCT_NOT_FOUND y error.message de texto. El consumidor devuelve kind: not-found. Se eligió este caso porque una ausencia esperada debe distinguirse de un fallo del servidor o de una ruta equivocada.')
para('Las dos respuestas utilizan Content-Type: application/json; charset=utf-8. Las rutas, estados HTTP, identificador y código de error son valores exactos; los campos variables se comprueban con matchers de tipo. La muestra exitosa es un teclado con precio Q249.90 y disponibilidad verdadera.')
newpage()

# 3. Arquitectura
section('2. Arquitectura y herramientas')
story.append(diagram())
md.append('![Arquitectura](arquitectura.svg)\n')
para('ProductClient interpreta los resultados y utiliza HttpClient, un cliente HTTP reutilizable basado en fetch. La API usa node:http y consulta ProductRepository. Durante las pruebas del consumidor, Pact sustituye a la API; durante la verificación, el verificador envía solicitudes a la API real y compara las respuestas con el archivo JSON generado previamente.')
table([
    ['Herramienta', 'Versión / propósito'],
    ['Node.js / npm', '22.23.2 / 10.9.8; ejecución y dependencias'],
    ['TypeScript / tsx', '5.9.3 / 4.23.15; tipado estricto y ejecución'],
    ['Pact JS', '17.1.4; contrato de especificación Pact 3.0.0'],
    ['node:test / assert', 'Pruebas y assertions incluidas con Node.js'],
    ['Playwright / Python', '1.64.1 / 3.13.14; capturas e informe'],
    ['ReportLab / pypdf', '4.5.1 / 6.21.2; generación y revisión del PDF'],
], [145, 330])
md.append('Versiones: Node 22.23.2; npm 10.9.8; TypeScript 5.9.3; tsx 4.23.15; Pact JS 17.1.4; Playwright 1.64.1; Python 3.13.14; ReportLab 4.5.1; pypdf 6.21.2.\n')
newpage()

# 4. Metodología
section('3. Diseño y ejecución de las pruebas')
sub('Consumidor y generación automática', 'tests/consumer.pact.test.ts configura PactV3 y sus dos interacciones. executeTest inicia el servidor simulado y ejecuta el ProductClient y HttpClient reales contra su URL. Las assertions comparan los resultados completos. Pact verifica las solicitudes y escribe pacts/ProductConsumer-ProductProvider.json; este JSON no se redacta manualmente.')
sub('Matchers relevantes', 'string conserva el tipo de name y del mensaje; decimal exige un número decimal para price; boolean valida available. El id y PRODUCT_NOT_FOUND se fijan por igualdad para evitar que otro producto u otra clase de error sean aceptados como correctos.')
sub('Proveedor y estados independientes', 'tests/verify-provider.ts inicia la misma API usada por la aplicación. Los stateHandlers reemplazan por completo el catálogo: [sampleProduct] para existencia y [] para ausencia. Cada ejecución dispone de un repositorio propio y un puerto libre. Una prueba adicional comprueba las consultas en ambos órdenes y el servidor se cierra incluso si la verificación falla.')
sub('Componentes reales y controlados', 'Son reales el consumidor, fetch, la comunicación HTTP, la API, las rutas y la serialización. En las pruebas del consumidor la API se simula con Pact. En el proveedor se controlan los datos del repositorio en memoria, que es la persistencia real de esta aplicación; no se simula una base de datos externa.')
para('Las cinco pruebas complementarias comprueban HTTP 500, un 404 de otra causa, un precio de tipo incorrecto, un producto con otro ID y la independencia de estados. Estas pruebas complementan las dos interacciones contractuales.')
code('npm ci\nnpm test\nnpm run demo\nnpm run evidence:capture -- --edge\nnpm run report')
p('Para capturas sin Edge: npx playwright install chromium; luego npm run evidence:capture. Para reconstruir el PDF: python -m pip install -r requirements-report.txt. El README describe instalación y ejecución completa.', 'SmallCustom')
md.append('Alternativa sin Edge: `npx playwright install chromium` y `npm run evidence:capture`. Dependencias del informe: `python -m pip install -r requirements-report.txt`.\n')
newpage()

# 5-8. Evidencias originales
descriptions = [
    ('4. Evidencia: consumidor',
     'Se ejecutaron las dos pruebas con el cliente HTTP real contra el servidor simulado de Pact. Se esperaba interpretar correctamente el producto y el error estructurado. El resultado fue 2 pruebas aprobadas, 0 fallidas y salida 0; Pact generó automáticamente el contrato.'),
    ('5. Evidencia: proveedor compatible',
     'Se verificó el contrato generado contra la API real con sus estados independientes. Se esperaba cumplir ambos acuerdos. Pact confirmó los estados 200 y 404, los encabezados y los cuerpos de respuesta. La ejecución terminó con salida 0.'),
    ('6. Evidencia: incompatibilidad real',
     'Se activó --incompatible: el proveedor serializó price como texto. Se esperaba que Pact rechazara ese tipo. La interacción p-100 falló en $.price: esperaba decimal y recibió String. La interacción 404 siguió aprobada. El proceso devolvió 1 y el contrato no cambió.'),
    ('7. Evidencia: compatibilidad restaurada',
     'Se inició otra instancia sin la mutación, con price numérico. Se esperaba recuperar la compatibilidad. Pact aprobó nuevamente las dos interacciones y devolvió 0. La versión normal y la entrega final conservan el proveedor compatible.'),
]
for (title, interpretation), step in zip(descriptions, summary['steps']):
    section(title)
    para(interpretation)
    path = ROOT / f"evidencias/{step['name']}.png"
    img = Image(str(path))
    # Preserva la proporción y deja espacio para título e interpretación.
    scale = min(475 / img.imageWidth, 570 / img.imageHeight)
    img.drawWidth = img.imageWidth * scale
    img.drawHeight = img.imageHeight * scale
    story.append(img)
    p('Captura auténtica del visor de stdout original; no es una terminal nativa. stderr completo se conserva en los registros del repositorio.', 'SmallCustom')
    md.append(f"![{title}](../evidencias/{step['name']}.png)\n\nComando: `{step['command']}`. Código de salida: {step['exitCode']}. Registro: `evidencias/{step['name']}.log`.\n")
    newpage()

# 9. Reproducibilidad y conclusión
section('8. Reproducción, conclusiones y referencias')
sub('Demostración y restauración', 'npm run demo ejecuta las cuatro etapas y acepta únicamente las salidas 0, 0, 1 y 0. La etapa incompatible exige un BodyMismatch en $.price; no basta un fallo cualquiera. El cambio solo existe en la instancia de demostración. npm run test:provider restaura la compatibilidad al crear un proveedor sin esa opción, y npm test ejecuta la validación final completa.')
sub('Trazabilidad de la evidencia', 'resumen.json conserva fechas UTC, comandos, salidas y hashes SHA-256. Las capturas muestran la hora local de Guatemala. Los canales stdout y stderr se preservan por separado; el log combinado concatena ambos y no afirma su orden de intercalación. El visor elimina solo códigos de color ANSI para facilitar la lectura. El mismo contrato se utilizó en las cuatro etapas.')
p('SHA-256 del contrato: ' + contract_hash[:32] + '<br/>' + contract_hash[32:], 'CodeCustom')
md.append('SHA-256 del contrato: `' + contract_hash + '`.\n')
sub('Conclusiones', 'La verificación mostró que el consumidor y el proveedor son compatibles en los dos escenarios definidos. El fallo controlado demostró que conservar HTTP 200 no es suficiente: cambiar el tipo de un campo requerido rompe el acuerdo. Los estados independientes permitieron repetir las pruebas y recuperar el resultado correcto sin editar el contrato. Pact complementa las pruebas de comportamiento, pero este alcance no incluye carga, seguridad ni otros casos de negocio.')
para('La entrega incluye código, contrato generado, cuatro capturas, registros originales y README reproducible. El informe está listo para cargar manualmente en Canvas.')
p(f'Repositorio: <link href="{repo}" color="#267387">jefroMMM/Contract-Testing-con-Pact</link><br/>Versión final: <link href="{tag_url}" color="#267387">entrega-v1.0.0</link>', 'SmallCustom')
md.append(f'Repositorio: {repo}\n\nEtiqueta final: {tag_url}\n')
refs = [
    ('Pact JS: pruebas del consumidor', 'https://docs.pact.io/implementation_guides/javascript/docs/consumer'),
    ('Pact JS: verificación del proveedor', 'https://docs.pact.io/implementation_guides/javascript/docs/provider'),
    ('Pact: estados del proveedor', 'https://docs.pact.io/getting_started/provider_states'),
    ('Pact JS 17.1.4: requisitos del paquete', 'https://www.npmjs.com/package/@pact-foundation/pact/v/17.1.4'),
]
for label, url in refs:
    p(f'<link href="{url}" color="#267387">{label}</link>', 'SmallCustom')
    md.append(f'- [{label}]({url})')

def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setStrokeColor(colors.HexColor('#d0dce5'))
    canvas.line(52, 42, w-52, 42)
    canvas.setFillColor(colors.HexColor('#52677b'))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(52, 29, 'Jefry Ariel Mas Monterroso · Contract Testing con Pact')
    canvas.drawRightString(w-52, 29, str(doc.page))
    canvas.restoreState()

pdf_path = OUT / 'informe-contract-testing.pdf'
doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=52, leftMargin=52,
                        topMargin=43, bottomMargin=53, title='Compatibilidad entre consumidor y proveedor utilizando Pact',
                        author='Jefry Ariel Mas Monterroso')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
(ROOT / 'docs/informe.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
reader = PdfReader(pdf_path)
assert len(reader.pages) == 9, f'Revisar paginación: {len(reader.pages)} páginas'
text = '\n'.join(page.extract_text() for page in reader.pages)
for term in ['Jefry Ariel Mas Monterroso', 'Universidad Mariano', 'incompatibilidad', 'entrega-v1.0.0']:
    assert term in text, term
print(f'PDF generado y texto validado: {pdf_path} ({len(reader.pages)} páginas)')
