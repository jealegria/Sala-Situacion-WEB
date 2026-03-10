"""
=============================================================
  ESCÁNER FORENSE DE ARCHIVOS DE DATOS — GUI
  Detecta CSV, Excel real (.xlsx/.xls) y HTML disfrazado
=============================================================
  Requisitos: pip install chardet pandas beautifulsoup4 lxml openpyxl xlrd
=============================================================
"""

import os
import threading
import tkinter as tk
from tkinter import filedialog, scrolledtext
from pathlib import Path

# Importar lógica modularizada
from data_processor import DataScanner, DataNormalizer

# --- FIX DE NITIDEZ PARA WINDOWS (Evita que se vea difuminado) ---
try:
    from ctypes import windll
    # Avisa a Windows que la app soporta alta resolución (DPI Aware)
    windll.shcore.SetProcessDpiAwareness(1)
except Exception:
    pass
# ----------------------------------------------------------------

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Data Scanner & Normalizer - AI Toolkit")
        self.geometry("1100x800")
        self.minsize(900, 700)
        
        # Instanciar procesadores
        self.scanner = DataScanner()
        self.normalizer = DataNormalizer()
        self.last_df = None # Para guardar el último DF analizado

        # Paleta de colores minimalista y plana
        self.C_BG = "#1e1e1e"
        self.C_PANEL = "#252526"
        self.C_BORDER = "#3e3e42"
        self.C_TEXT = "#cccccc"
        self.C_ACCENT = "#0e639c"
        self.C_ACCENT_H = "#1177bb"
        self.C_ACCENT_GREEN = "#2d7d46"
        self.C_ACCENT_GREEN_H = "#369453"
        self.C_BTN = "#333333"
        self.C_BTN_H = "#444444"

        self.configure(bg=self.C_BG)
        self._build_ui()

    def _build_ui(self):
        font_ui = ("Segoe UI", 10)
        font_btn = ("Segoe UI", 10, "bold")
        font_console = ("Consolas", 10)

        # Top Bar
        top_frame = tk.Frame(self, bg=self.C_PANEL, pady=15, padx=20)
        top_frame.pack(fill="x")
        tk.Label(top_frame, text="Data Scanner & Normalizer", font=("Segoe UI", 14, "bold"), bg=self.C_PANEL, fg="#fff").pack(side="left")
        tk.Frame(self, bg=self.C_BORDER, height=1).pack(fill="x")

        # Controls
        ctrl_frame = tk.Frame(self, bg=self.C_BG, padx=20, pady=15)
        ctrl_frame.pack(fill="x")

        self.ruta_var = tk.StringVar()
        entry_border = tk.Frame(ctrl_frame, bg=self.C_BORDER, padx=1, pady=1)
        entry_border.pack(side="left", fill="x", expand=True, padx=(0, 15))
        self.entry = tk.Entry(entry_border, textvariable=self.ruta_var, font=font_ui, bg=self.C_PANEL, fg="#fff", insertbackground="#fff", relief="flat", bd=8)
        self.entry.pack(fill="both", expand=True)

        def make_btn(parent, text, cmd, bg, fg, hover):
            btn = tk.Button(parent, text=text, command=cmd, font=font_btn, bg=bg, fg=fg, activebackground=hover, activeforeground=fg, relief="flat", bd=0, padx=15, pady=6, cursor="hand2")
            btn.bind("<Enter>", lambda e: btn.config(bg=hover))
            btn.bind("<Leave>", lambda e: btn.config(bg=bg))
            return btn

        btn_file = make_btn(ctrl_frame, "Archivo", self._sel_archivo, self.C_BTN, self.C_TEXT, self.C_BTN_H)
        btn_file.pack(side="left", padx=5)
        btn_dir = make_btn(ctrl_frame, "Carpeta", self._sel_carpeta, self.C_BTN, self.C_TEXT, self.C_BTN_H)
        btn_dir.pack(side="left", padx=5)
        
        self.btn_run = make_btn(ctrl_frame, "1. Diagnosticar", self._analizar, self.C_ACCENT, "#fff", self.C_ACCENT_H)
        self.btn_run.pack(side="left", padx=5)

        self.btn_norm = make_btn(ctrl_frame, "2. Normalizar", self._normalizar, self.C_ACCENT_GREEN, "#fff", self.C_ACCENT_GREEN_H)
        self.btn_norm.pack(side="left", padx=5)
        self.btn_norm.config(state="disabled") # Deshabilitado hasta que haya un diagnóstico

        # Console Toolbar
        toolbar = tk.Frame(self, bg=self.C_PANEL, padx=20, pady=8)
        toolbar.pack(fill="x")
        tk.Label(toolbar, text="OUTPUT (MARKDOWN)", font=("Segoe UI", 9, "bold"), bg=self.C_PANEL, fg="#858585").pack(side="left")
        make_btn(toolbar, "Copiar", self._copiar, self.C_BTN, self.C_TEXT, self.C_BTN_H).pack(side="right")
        make_btn(toolbar, "Limpiar", self._limpiar, self.C_BTN, self.C_TEXT, self.C_BTN_H).pack(side="right", padx=10)
        self.status = tk.Label(toolbar, text="", font=font_ui, bg=self.C_PANEL, fg="#4CAF50")
        self.status.pack(side="right", padx=15)

        # Console
        c_border = tk.Frame(self, bg=self.C_BORDER, padx=1, pady=1)
        c_border.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        self.console = scrolledtext.ScrolledText(c_border, font=font_console, bg=self.C_BG, fg="#d4d4d4", insertbackground="#fff", relief="flat", bd=10, wrap="none", state="disabled")
        self.console.pack(fill="both", expand=True)
        h_scroll = tk.Scrollbar(c_border, orient="horizontal", command=self.console.xview)
        h_scroll.pack(fill="x")
        self.console.configure(xscrollcommand=h_scroll.set)

    def _sel_archivo(self):
        ruta = filedialog.askopenfilename(filetypes=[("Datos", "*.csv *.xls *.xlsx *.txt *.tsv"), ("Todo", "*.*")])
        if ruta: self.ruta_var.set(ruta)

    def _sel_carpeta(self):
        ruta = filedialog.askdirectory()
        if ruta: self.ruta_var.set(ruta)

    def _log(self, texto):
        def _write():
            self.console.configure(state="normal")
            self.console.insert("end", texto + "\n")
            self.console.see("end")
            self.console.configure(state="disabled")
        self.after(0, _write)

    def _limpiar(self):
        self.console.configure(state="normal")
        self.console.delete("1.0", "end")
        self.console.configure(state="disabled")
        self.last_df = None
        self.btn_norm.config(state="disabled")

    def _copiar(self):
        texto = self.console.get("1.0", "end").strip()
        if texto:
            self.clipboard_clear()
            self.clipboard_append(texto)
            self.status.config(text="¡Copiado!")
            self.after(2000, lambda: self.status.config(text=""))

    def _analizar(self):
        ruta = self.ruta_var.get().strip()
        if not ruta: return
        self.btn_run.config(state="disabled", text="Analizando...")
        self._limpiar()

        def run():
            try:
                path = Path(ruta)
                archivos = [ruta] if path.is_file() else [str(p) for p in path.iterdir() if p.suffix.lower() in ['.csv', '.xls', '.xlsx', '.txt', '.tsv']]
                
                for arch in archivos:
                    df = self.scanner.generar_reporte_markdown(arch, self._log)
                    if df is not None:
                        self.last_df = df # Guardamos el último para normalizar
                
                if self.last_df is not None:
                    self.after(0, lambda: self.btn_norm.config(state="normal"))

            except Exception as e:
                self._log(f"\n**ERROR:**\n```text\n{e}\n```")
            finally:
                self.after(0, lambda: self.btn_run.config(state="normal", text="1. Diagnosticar"))

        threading.Thread(target=run, daemon=True).start()

    def _normalizar(self):
        if self.last_df is None: return
        self._log("\n---\n")
        self.normalizer.normalizar(self.last_df, self._log)

if __name__ == "__main__":
    app = App()
    app.mainloop()