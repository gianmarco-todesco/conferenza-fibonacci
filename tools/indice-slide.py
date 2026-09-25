"""Stampa la tabella degli indici delle slide, leggendola da index.html.

Gli indici sono posizionali: l'ordine dei tag <script> in slides/index.html e'
l'ordine delle slide, e ogni modulo si registra da solo costruendo l'oggetto
Slide in fondo al file. Quindi basta inserire una slide in mezzo e tutto
quello che viene dopo si sposta - e la tabella in STATO-PROGETTO.md invecchia.

Contarli a mano e' facile sbagliarlo, perche' alcuni file registrano piu' di
una slide: rabbits.js ne fa due (conigli e mitosi), spiral.js quattro.

Come le riconosce. Cerca nel file le classi che estendono Slide - anche
indirettamente, se una estende un'altra che estende Slide - e poi conta le
costruzioni di QUELLE classi. Contare tutti i  new  del modulo non funziona:
i sorgenti costruiscono anche Two.Path, Rect, PointGrid e altro, e il conto
viene mezzo piu' alto del vero.

    python tools/indice-slide.py

Il risultato si verifica aprendo il mazzo e controllando un paio di indici:
andare su  index.html#<n>  e leggere  window.slide.name .
"""
import io
import re
import sys
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
INDEX = RADICE / 'slides' / 'index.html'

EREDITA = re.compile(r'class\s+(\w+)\s+extends\s+(\w+)')
NOME = re.compile(r'super\("([^"]+)"\)')


def classi_slide(testo):
    """I nomi delle classi del file che discendono da Slide."""
    archi = EREDITA.findall(testo)
    figli = {'Slide'}
    # si ripete finche' non si aggiunge piu' niente: le catene sono corte ma
    # esistono (una classe base comune a due slide)
    cambiato = True
    while cambiato:
        cambiato = False
        for figlio, padre in archi:
            if padre in figli and figlio not in figli:
                figli.add(figlio)
                cambiato = True
    figli.discard('Slide')
    return figli


def slide_di(percorso):
    testo = io.open(percorso, encoding='utf-8', errors='replace').read()
    classi = classi_slide(testo)
    n = 0
    for c in classi:
        n += len(re.findall(r'^\s*(?:let|const|var)\s+\w+\s*=\s*new\s+' + c + r'\s*\(',
                            testo, re.M))
    return n, sorted(set(NOME.findall(testo)))


def main():
    html = io.open(INDEX, encoding='utf-8').read()
    # i tag dentro i commenti non contano: sono le slide disattivate
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    moduli = re.findall(r'<script src="(pages/[^"]+)" type="module">', html)

    i = 0
    print('| # | slide | file | stato |')
    print('|---|---|---|---|')
    for m in moduli:
        p = RADICE / 'slides' / m
        if not p.exists():
            print('MANCA:', m, file=sys.stderr)
            continue
        n, nomi = slide_di(p)
        if n == 0:
            print('nessuna slide registrata in', m, file=sys.stderr)
            continue
        etichetta = str(i) if n == 1 else '%d-%d' % (i, i + n - 1)
        print('| %s | %s | `%s` | |' % (etichetta, ', '.join(nomi) or '?',
                                        m.replace('pages/', '')))
        i += n
    print()
    print('totale: %d slide' % i)


if __name__ == '__main__':
    main()
