"""
Gera as miniaturas das cartas (WebP leve) usadas no álbum, nas grades e nas listas.

    python tools/gerar-miniaturas.py           # só cria/atualiza o que mudou
    python tools/gerar-miniaturas.py --todas   # refaz todas

Por quê: as fotos originais têm até 630x880 px, mas a carta pequena aparece com
~110-200 px de largura. Com todas as cartas liberadas, decodificar centenas de fotos
grandes travava a rolagem. A miniatura tem até 360 px de largura (nítida mesmo em
celular com tela de alta densidade) e pesa uma fração do original.

Lê os caminhos de js/imagens.js e grava em assets/cartas-mini/ espelhando as pastas:
    assets/cartas/jogadores/jog-x.jpg  ->  assets/cartas-mini/jogadores/jog-x.webp
As cartas grandes (detalhe, vitrine, abertura de pacote) continuam com a foto original.
Se faltar a miniatura de alguma imagem nova, a carta usa a original sozinha (nada quebra);
rode este script de novo depois de adicionar imagens.

Requer Python 3 com Pillow (com suporte a WebP).
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = 'assets/cartas/'
DESTINO = 'assets/cartas-mini/'
LARGURA = 360
QUALIDADE = 80


def caminhos_das_imagens():
    """Caminhos 'assets/cartas/...' citados em js/imagens.js (ignora linhas de comentário)."""
    texto = (RAIZ / 'js' / 'imagens.js').read_text(encoding='utf-8')
    achados = set()
    for linha in texto.splitlines():
        if linha.lstrip().startswith('//'):
            continue
        achados.update(re.findall(r"'(" + re.escape(ORIGEM) + r"[^']+\.(?:png|jpe?g|webp))'", linha, re.I))
    return sorted(achados)


def miniatura_de(caminho):
    return re.sub(r'\.(png|jpe?g|webp)$', '.webp', DESTINO + caminho[len(ORIGEM):], flags=re.I)


def gerar(origem, destino):
    with Image.open(origem) as im:
        im = ImageOps.exif_transpose(im)
        tem_alfa = im.mode in ('RGBA', 'LA', 'PA') or (im.mode == 'P' and 'transparency' in im.info)
        im = im.convert('RGBA' if tem_alfa else 'RGB')
        if im.width > LARGURA:
            im = im.resize((LARGURA, round(im.height * LARGURA / im.width)), Image.LANCZOS)
        destino.parent.mkdir(parents=True, exist_ok=True)
        temp = destino.with_suffix('.tmp')          # grava inteiro antes de substituir (sem arquivo pela metade)
        im.save(temp, 'WEBP', quality=QUALIDADE, method=4)
        temp.replace(destino)


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')   # acentos certos no terminal do Windows
    except (AttributeError, ValueError):
        pass
    todas = '--todas' in sys.argv
    feitas = puladas = faltando = 0
    antes = depois = 0
    for rel in caminhos_das_imagens():
        origem = RAIZ / rel
        destino = RAIZ / miniatura_de(rel)
        if not origem.exists():
            faltando += 1
            print(f'  (não encontrada) {rel}')
            continue
        if not todas and destino.exists() and destino.stat().st_mtime >= origem.stat().st_mtime:
            puladas += 1
        else:
            gerar(origem, destino)
            feitas += 1
        antes += origem.stat().st_size
        depois += destino.stat().st_size
    print(f'Miniaturas: {feitas} geradas, {puladas} já em dia, {faltando} imagens não encontradas.')
    if antes:
        print(f'Peso: originais {antes / 1e6:.1f} MB -> miniaturas {depois / 1e6:.1f} MB ({depois / antes:.0%}).')


if __name__ == '__main__':
    main()
