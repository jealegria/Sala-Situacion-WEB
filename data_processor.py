import os
import csv
import re
import chardet
import pandas as pd
from pathlib import Path
from bs4 import BeautifulSoup

class DataScanner:
    """
    Handles detection, loading, and analysis of data files.
    """
    @staticmethod
    def detectar_tipo_archivo(ruta):
        ext = Path(ruta).suffix.lower()
        if ext in ['.csv', '.txt', '.tsv']:
            return 'csv'
        if ext == '.xlsx':
            return 'excel_real'
        if ext == '.xls':
            with open(ruta, 'rb') as f:
                encabezado = f.read(512)
            if b'<!DOCTYPE' in encabezado or b'<html' in encabezado.lower():
                return 'html_disfrazado'
            return 'excel_real'
        return 'desconocido'

    @staticmethod
    def normalizar_vacios(df):
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].replace('', pd.NA)
                df[col] = df[col].apply(lambda x: pd.NA if isinstance(x, str) and x.strip() == '' else x)
        return df

    @staticmethod
    def tiene_caracteres_especiales_valores(serie):
        patron = re.compile(r'[áéíóúàèìòùâêîôûãõäëïöüçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÇÑ¿¡]')
        muestra = serie.dropna().astype(str).head(500)
        return muestra.apply(lambda x: bool(patron.search(x))).any()

    @staticmethod
    def tiene_caracteres_especiales_texto(texto):
        patron = re.compile(r'[áéíóúàèìòùâêîôûãõäëïöüçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÇÑ¿¡]')
        return bool(patron.search(texto))

    def analizar_columna(self, nombre, serie):
        total = len(serie)
        nulos = serie.isna().sum()
        no_nulos = serie.notna().sum()
        dtype = str(serie.dtype)

        resultado = {
            "nombre": nombre, "dtype": dtype, "total": total, "nulos": nulos, "no_nulos": no_nulos,
            "pct_nulo": round(nulos / total * 100, 1) if total > 0 else 0,
            "unicos": serie.nunique(), "nombre_tiene_especiales": self.tiene_caracteres_especiales_texto(nombre),
            "valores_tienen_especiales": False, "parseable_como_fecha": False, "parseable_como_numero": False,
            "ejemplo_valores": [], "notas": []
        }

        if no_nulos == 0:
            resultado["notas"].append("Columna completamente vacía.")
            return resultado

        resultado["ejemplo_valores"] = [repr(v) for v in serie.dropna().head(5).tolist()]

        if dtype in ['object', 'string']:
            resultado["valores_tienen_especiales"] = self.tiene_caracteres_especiales_valores(serie)
            try:
                parseada = pd.to_datetime(serie.dropna().head(200), dayfirst=True, errors='coerce')
                pct_ok = parseada.notna().mean()
                if pct_ok > 0.8:
                    resultado["parseable_como_fecha"] = True
                    resultado["notas"].append(f"Parseable como fecha ({pct_ok:.0%} éxito) | Rango: {parseada.min().date()} -> {parseada.max().date()}")
            except: pass

            if not resultado["parseable_como_fecha"]:
                try:
                    num = pd.to_numeric(serie.dropna().head(200), errors='coerce')
                    pct_ok = num.notna().mean()
                    if pct_ok > 0.8:
                        resultado["parseable_como_numero"] = True
                        resultado["notas"].append(f"Parseable como número ({pct_ok:.0%} éxito)")
                except: pass

        if resultado["pct_nulo"] > 80:
            resultado["notas"].append("ATENCIÓN: Más del 80% de valores nulos/vacíos.")
        elif resultado["pct_nulo"] > 30:
            resultado["notas"].append(f"Advertencia: {resultado['pct_nulo']}% de valores nulos/vacíos.")

        return resultado

    @staticmethod
    def cargar_csv(ruta):
        with open(ruta, 'rb') as f: raw = f.read(100000)
        det = chardet.detect(raw)
        encoding = det['encoding'] or 'utf-8'
        if encoding.lower() in ['iso-8859-1', 'windows-1252', 'ascii']: encoding = 'cp1252'

        muestra = ''
        for enc in [encoding, 'utf-8-sig', 'utf-8', 'cp1252', 'latin-1']:
            try:
                with open(ruta, 'r', encoding=enc, errors='strict') as f:
                    muestra = f.read(4096)
                break
            except UnicodeDecodeError: continue

        try: separador = csv.Sniffer().sniff(muestra, delimiters=',;|\t').delimiter
        except: separador = max([',', ';', '|', '\t'], key=muestra.count)

        df, encoding_final = None, encoding
        for enc in [encoding, 'utf-8-sig', 'utf-8', 'cp1252', 'latin-1']:
            try:
                df = pd.read_csv(ruta, encoding=enc, sep=separador, on_bad_lines='skip', engine='python')
                encoding_final = enc
                break
            except: continue

        return df, encoding_final, det['confidence'], separador

    @staticmethod
    def cargar_excel_real(ruta):
        ext = Path(ruta).suffix.lower()
        engine = 'openpyxl' if ext == '.xlsx' else 'xlrd'
        return pd.read_excel(ruta, engine=engine), engine

    @staticmethod
    def cargar_html_disfrazado(ruta):
        contenido, encoding_final = None, 'utf-8'
        for enc in ['utf-8', 'utf-8-sig', 'cp1252', 'latin-1']:
            try:
                with open(ruta, 'r', encoding=enc, errors='strict') as f: contenido = f.read()
                encoding_final = enc
                break
            except UnicodeDecodeError: continue

        if not contenido:
            with open(ruta, 'r', encoding='utf-8', errors='replace') as f: contenido = f.read()

        tabla = BeautifulSoup(contenido, 'lxml').find('table')
        if not tabla: raise ValueError("No se encontró ninguna tabla HTML en el archivo")

        filas = tabla.find_all('tr')
        headers = [th.get_text(strip=True) for th in filas[0].find_all('th')]
        if not headers: headers = [td.get_text(strip=True) for td in filas[0].find_all('td')]

        rows = [[td.get_text(strip=True) for td in f.find_all('td')] for f in filas[1:] if f.find_all('td')]
        return pd.DataFrame(rows, columns=headers), encoding_final

    def generar_reporte_markdown(self, ruta, log_func):
        nombre_archivo = Path(ruta).name
        log_func(f"# REPORTE DE ANÁLISIS: `{nombre_archivo}`\n")
        log_func("## 1. METADATOS DEL ARCHIVO")
        log_func(f"- **Ruta absoluta:** `{ruta}`")
        log_func(f"- **Tamaño:** {os.path.getsize(ruta) / 1024:.1f} KB")

        tipo = self.detectar_tipo_archivo(ruta)
        tipo_labels = {'csv': 'CSV / Texto delimitado', 'excel_real': 'Excel binario', 'html_disfrazado': 'HTML disfrazado de .xls'}
        log_func(f"- **Tipo detectado:** {tipo_labels.get(tipo, tipo)}")

        df, estrategia = None, ""
        try:
            if tipo == 'csv':
                df, enc, conf, sep = self.cargar_csv(ruta)
                log_func(f"- **Encoding detectado:** `{enc}`")
                log_func(f"- **Separador detectado:** `{repr(sep)}`")
                estrategia = f"pd.read_csv(ruta, encoding='{enc}', sep='{sep}')"
            elif tipo == 'excel_real':
                df, engine = self.cargar_excel_real(ruta)
                log_func(f"- **Engine Pandas:** `{engine}`")
                estrategia = f"pd.read_excel(ruta, engine='{engine}')"
            elif tipo == 'html_disfrazado':
                df, enc = self.cargar_html_disfrazado(ruta)
                log_func(f"- **Encoding HTML:** `{enc}`")
                estrategia = f"BeautifulSoup(open(ruta, encoding='{enc}'), 'lxml')"
            else:
                log_func("\n**ERROR:** Tipo de archivo no soportado.\n")
                return None
        except Exception as e:
            log_func(f"\n**ERROR AL CARGAR:**\n```text\n{e}\n```\n")
            return None

        df = self.normalizar_vacios(df)
        log_func("\n## 2. ESTRATEGIA DE LECTURA (PYTHON)")
        log_func(f"```python\n{estrategia}\n```\n")

        log_func("## 3. DIMENSIONES Y FORMA")
        log_func(f"- **Filas:** {len(df):,}")
        log_func(f"- **Columnas:** {len(df.columns)}\n")

        log_func("## 4. ANÁLISIS DE COLUMNAS")
        alertas = {"nombres_esp": [], "valores_esp": [], "fechas": [], "nulos": []}

        for col in df.columns:
            info = self.analizar_columna(col, df[col])
            log_func(f"### `{col}`")
            log_func(f"- **Tipo de dato:** `{info['dtype']}`")
            log_func(f"- **Nulos/Vacíos:** {info['nulos']:,} ({info['pct_nulo']}%)")
            log_func(f"- **Valores únicos:** {info['unicos']:,}")
            
            if info["nombre_tiene_especiales"]: alertas["nombres_esp"].append(col)
            if info["valores_tienen_especiales"]: alertas["valores_esp"].append(col)
            if info["parseable_como_fecha"]: alertas["fechas"].append(col)
            if info["pct_nulo"] > 30: alertas["nulos"].append(col)

            if info["ejemplo_valores"]: log_func(f"- **Ejemplos:** {', '.join(info['ejemplo_valores'][:3])}")
            for nota in info["notas"]: log_func(f"  - {nota}")
            log_func("")

        log_func("## 5. RESUMEN DE ALERTAS")
        if alertas["nombres_esp"]: log_func(f"- **Columnas con caracteres especiales en NOMBRE:** `{', '.join(alertas['nombres_esp'])}`")
        if alertas["valores_esp"]: log_func(f"- **Columnas con caracteres especiales en VALORES:** `{', '.join(alertas['valores_esp'])}`")
        if alertas["fechas"]: log_func(f"- **Posibles columnas de FECHA:** `{', '.join(alertas['fechas'])}`")
        if alertas["nulos"]: log_func(f"- **Columnas con alta tasa de nulos (>30%):** `{', '.join(alertas['nulos'])}`")
        log_func("\n---\n")
        
        return df

class DataNormalizer:
    """
    Placeholder class for future normalization logic.
    """
    def __init__(self):
        pass

    def normalizar(self, df, log_func):
        """
        Placeholder method for normalization.
        """
        log_func("### INICIANDO NORMALIZACIÓN (Placeholder)")
        log_func("Esta funcionalidad está lista para ser implementada.")
        log_func("- Limpieza de nombres de columnas...")
        log_func("- Estandarización de formatos de fecha...")
        log_func("- Remoción de duplicados...")
        log_func("\n**PENDIENTE:** Definir reglas específicas de normalización.")
        return df
