#!/usr/bin/env python3
"""Server statico per lo sviluppo delle slide, che vieta la cache.

Serve la cartella in cui si trova questo file, cosi' i percorsi assoluti
delle slide (/slides/assets/...) funzionano.

    python serve.py              ->  http://127.0.0.1:8765/slides/index.html
    python serve.py 9000         ->  sulla porta 9000

Perche' non basta un pragma nell'HTML: <meta http-equiv="Cache-Control">
non e' un pragma conforme, Chrome lo ignora, e comunque non ha mai riguardato
le sottorisorse. In piu' gmtlib.js non e' caricato da un tag <script> ma
importato dentro i moduli, quindi una query di cache-busting sui tag non lo
raggiungerebbe: resterebbe la versione vecchia senza che niente lo segnali.
"""

import functools
import http.server
import os
import sys

PORTA_DEFAULT = 8765


class SenzaCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, formato, *args):
        # Una riga sola per richiesta, senza la data che riempie il terminale.
        sys.stderr.write('%s\n' % (formato % args))


def main():
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else PORTA_DEFAULT
    radice = os.path.dirname(os.path.abspath(__file__))

    gestore = functools.partial(SenzaCache, directory=radice)
    server = http.server.HTTPServer(('127.0.0.1', porta), gestore)

    print('Radice : %s' % radice)
    print('Slide  : http://127.0.0.1:%d/slides/index.html' % porta)
    print('Ctrl-C per fermare.\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nfermato.')


if __name__ == '__main__':
    main()
