"""
baixar_tse.py
-------------
Baixa automaticamente o ZIP nacional do "Perfil do Eleitorado" do portal
de dados abertos do TSE, descompacta os CSVs na pasta de dados do projeto
(onde o ETL lê) e arquiva o ZIP original com a data do download.
Projeto EleitoBR.

Fluxo:
    1. Abre a página do conjunto de dados do ano escolhido
    2. Pega o link do recurso nacional "Eleitorado - ANO" e baixa o .zip
    3. Extrai os CSVs em   ../data
    4. Arquiva o .zip em   ../data/_raw   com a data do download

Requisitos:
    pip install selenium   (dentro do venv)
    Google Chrome instalado

Uso:
    python baixar_tse.py
"""

import shutil
import time
import zipfile
from datetime import date
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ---------------------------------------------------------------------------
# 1. CONFIGURAÇÃO
# ---------------------------------------------------------------------------
ANO = "2026"  # <- mude aqui para outro ano

URL_DATASET = f"https://dadosabertos.tse.jus.br/dataset/eleitorado-{ANO}"

# Pasta de dados do projeto (antes você colocava os CSVs aqui na mão).
# Assume a estrutura:  EleitoBR/scripts/baixar_tse.py  e  EleitoBR/data/
# Se a sua pasta "data" estiver em outro caminho, ajuste a linha abaixo.
PASTA_DADOS = Path(__file__).parent.parent / "data"
PASTA_RAW = PASTA_DADOS / "_raw"  # guarda o .zip original, com data
PASTA_DADOS.mkdir(parents=True, exist_ok=True)
PASTA_RAW.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# 2. OPÇÕES DO CHROME
# ---------------------------------------------------------------------------
options = Options()
options.add_experimental_option(
    "prefs",
    {
        "download.default_directory": str(PASTA_RAW.resolve()),  # zip cai no _raw
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
    },
)
# No WSL (sem interface gráfica), deixe estas linhas ativas:
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")


# ---------------------------------------------------------------------------
# 3. FUNÇÃO AUXILIAR: esperar um .zip NOVO terminar de baixar
# ---------------------------------------------------------------------------
def esperar_download(pasta: Path, zips_antigos: set, timeout: int = 600) -> Path:
    """Espera sumir qualquer .crdownload e retorna o .zip recém-baixado."""
    limite = time.time() + timeout
    while time.time() < limite:
        baixando = any(f.suffix == ".crdownload" for f in pasta.iterdir())
        novos = [f for f in pasta.glob("*.zip") if f not in zips_antigos]
        if not baixando and novos:
            return max(novos, key=lambda f: f.stat().st_mtime)
        time.sleep(1)
    raise TimeoutError("O download demorou demais e foi cancelado.")


# ---------------------------------------------------------------------------
# 4. ROBÔ
# ---------------------------------------------------------------------------
driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 20)

# Isola o BLOCO do recurso nacional ("Eleitorado - 2026"), ignorando os demais
BLOCO_NACIONAL = (
    f"//li[contains(@class,'resource-item')]"
    f"[.//a[contains(@title,'Eleitorado - {ANO}')]]"
)

try:
    # (a) abrir a página do conjunto de dados
    print(f"Abrindo {URL_DATASET} ...")
    driver.get(URL_DATASET)

    # (b) pegar o link do .zip direto do HTML (sem clicar em "Explorar")
    print("Procurando o link do arquivo...")
    link_zip = wait.until(
        EC.presence_of_element_located(
            (By.XPATH, BLOCO_NACIONAL + "//a[contains(@href, '.zip')]")
        )
    )
    url_arquivo = link_zip.get_attribute("href")
    print(f"Arquivo: {url_arquivo}")

    # (c) baixar
    print("Baixando... (aguarde)")
    zips_antigos = set(PASTA_RAW.glob("*.zip"))  # para detectar o arquivo novo
    driver.get(url_arquivo)
    arquivo_zip = esperar_download(PASTA_RAW, zips_antigos)
    print(f"Download concluído: {arquivo_zip.name}")

    # (d) extrair SÓ o arquivo nacional consolidado (…_BRASIL.csv) e salvá-lo
    #     como data/eleitorado.csv — que é o nome que o ETL (etl/load.js) lê.
    #     Os 27 arquivos por UF são redundantes com o BRASIL, então ignoramos
    #     (economiza ~2 GB de disco).
    print("Extraindo o arquivo nacional como eleitorado.csv ...")
    destino = PASTA_DADOS / "eleitorado.csv"
    with zipfile.ZipFile(arquivo_zip, "r") as z:
        membro_brasil = next(
            (m for m in z.namelist() if m.upper().endswith("BRASIL.CSV")), None
        )
        if membro_brasil is None:
            raise RuntimeError("Arquivo *_BRASIL.csv não encontrado dentro do zip.")
        with z.open(membro_brasil) as origem, open(destino, "wb") as saida:
            shutil.copyfileobj(origem, saida)

    # (e) arquivar o .zip com a data do download (rastreabilidade p/ o TCC)
    zip_datado = PASTA_RAW / f"{arquivo_zip.stem}_{date.today().isoformat()}.zip"
    arquivo_zip.replace(zip_datado)

    print(f"Pronto! Arquivo pronto para o ETL: {destino}")
    print(f"ZIP arquivado em: {zip_datado}")

finally:
    driver.quit()