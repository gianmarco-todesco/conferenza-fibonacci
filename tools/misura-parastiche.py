"""Misura le parastiche di una foto di girasole. Non conta a occhio: le conta.

L'idea. Attorno al centro del capolino, in coordinate (theta, u) con
u = sqrt(r), una famiglia di m bracci e' un reticolo periodico in theta con
periodo 2*pi/m. Si trovano i fiori come massimi locali, e sull'insieme dei
punti si calcola direttamente

    S(m, n) = | somma_k exp( i (m*theta_k + n*u_k) ) |

che ha un picco netto in corrispondenza di ogni famiglia. Il massimo su n, per
ogni m, da' lo spettro angolare: i suoi picchi SONO i numeri delle parastiche.

Perche' sqrt(r) e non log(r). Le parastiche di un girasole NON sono spirali
logaritmiche: i semi stanno su r = c*sqrt(n) (modello di Vogel), quindi in
coordinate log-polari una famiglia non e' una retta e il picco si sparpaglia
sui vari n. In sqrt(r) e' una retta, e il picco si stringe.

Due trappole, pagate entrambe per arrivare qui:

 1. Il centro e' il parametro piu' delicato di tutti. Su sunflower-2.png,
    sbagliarlo di 60 px sposta la risposta da 26 a 33. Va cercato su tutta la
    zona e non attorno alla stima a occhio, se no l'ottimizzazione resta in un
    massimo locale e da' un numero sbagliato con aria convinta.

 2. Non filtrare l'immagine passa-alto prima di trasformare. Un passa-alto a
    sigma px cancella le lunghezze d'onda sopra ~2*sigma, e il passo angolare
    della famiglia piu' piccola cade proprio li': si cancella il fondamentale e
    si misura la sua seconda armonica, cioe' il doppio del numero giusto.

Uso:  python tools/misura-parastiche.py slides/assets/sunflower-2.png
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, maximum_filter

FIB = (8, 13, 21, 34, 55, 89, 144)


def trova_fiori(path, sigma_piccolo=2.0, sigma_grande=6.0, finestra=9, soglia=0.004):
    """Massimi locali della differenza di gaussiane: un punto per fiore."""
    a = np.asarray(Image.open(path).convert('L'), dtype=np.float64) / 255.0
    dog = gaussian_filter(a, sigma_piccolo) - gaussian_filter(a, sigma_grande)
    m = (dog == maximum_filter(dog, size=finestra)) & (dog > soglia)
    ys, xs = np.nonzero(m)
    return xs.astype(float), ys.astype(float)


def spettro(xs, ys, cx, cy, rmin, rmax, mmax=100, nmax=16):
    """Per ogni m, il massimo su n di S(m, n). Ritorna anche n e fase migliori."""
    r = np.hypot(xs - cx, ys - cy)
    k = (r > rmin) & (r < rmax)
    if k.sum() < 80:
        return None
    th = np.arctan2(ys[k] - cy, xs[k] - cx)
    u = np.sqrt(r[k])
    mu, sd = u.mean(), u.std()
    u = (u - mu) / sd
    m = np.arange(1, mmax + 1)[:, None, None]
    n = np.arange(-nmax, nmax + 1)[None, :, None]
    C = np.exp(1j * (m * th[None, None, :] + n * u[None, None, :])).sum(axis=2) / k.sum()
    A = np.abs(C)
    i = A.argmax(axis=1)
    return {'amp': A.max(axis=1), 'n': i - nmax, 'fase': np.angle(C[np.arange(mmax), i]),
            'mu': mu, 'sd': sd, 'fiori': int(k.sum())}


def cerca_centro(xs, ys, box, rmin, rmax, passo=10.0):
    """Ricerca GROSSOLANA su tutta la zona, poi raffinamento. Vedi trappola 1."""
    def qualita(cx, cy):
        s = spettro(xs, ys, cx, cy, rmin, rmax, mmax=70, nmax=12)
        return 0.0 if s is None else float(s['amp'][9:].max())
    x0, x1, y0, y1 = box
    best = max(((qualita(cx, cy), cx, cy)
                for cx in np.arange(x0, x1, passo)
                for cy in np.arange(y0, y1, passo)), key=lambda t: t[0])
    _, cx, cy = best
    p = passo / 2
    for _ in range(6):
        b = (qualita(cx, cy), cx, cy)
        for dx in (-p, 0, p):
            for dy in (-p, 0, p):
                v = qualita(cx + dx, cy + dy)
                if v > b[0]:
                    b = (v, cx + dx, cy + dy)
        _, cx, cy = b
        p /= 2
    return cx, cy


def giugazione(xs, ys, cx, cy, rmin, rmax, ordini=(2, 3, 5)):
    """Correlazione del disegno con se stesso ruotato di 1/J di giro, per vari J.

    Serve per scartare i numeri sbagliati che hanno un fattore in comune con il
    partner: due parastiche adiacenti con gcd = J sono possibili solo su un
    capolino J-giugato, che ha simmetria esatta di 1/J di giro. Cosi' 56 (gcd 2
    con 34) e 35 (gcd 5 con 55) si escludono con una misura, non a occhio.
    """
    r = np.hypot(xs - cx, ys - cy)
    k = (r > rmin) & (r < rmax)
    th = np.arctan2(ys[k] - cy, xs[k] - cx) % (2 * np.pi)
    nth = 720
    h = np.histogram(th, bins=nth, range=(0, 2 * np.pi))[0].astype(float)
    h -= h.mean()
    F = np.fft.rfft(h)
    ac = np.fft.irfft(F * np.conj(F))
    return {J: float(ac[nth // J] / ac[0]) for J in ordini}


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'slides/assets/sunflower-2.png'
    xs, ys = trova_fiori(path)
    W, H = Image.open(path).size
    print('%s  (%d x %d)   massimi locali: %d' % (path, W, H, len(xs)))

    RMIN, RMAX = 95.0, 295.0
    cx, cy = cerca_centro(xs, ys, (0.40 * W, 0.65 * W, 0.42 * H, 0.60 * H), RMIN, RMAX)
    print('centro: %.1f , %.1f' % (cx, cy))
    g = giugazione(xs, ys, cx, cy, RMIN, RMAX)
    print('simmetria di rotazione: ' + '   '.join('1/%d giro: %+.3f' % (J, v)
                                                  for J, v in sorted(g.items())))
    print('   (tutte vicine a 0 = monogiugato: le parastiche adiacenti sono coprime)')

    for r0, r1 in [(RMIN, RMAX), (95.0, 175.0), (150.0, 235.0), (200.0, 295.0)]:
        s = spettro(xs, ys, cx, cy, r0, r1)
        top = np.argsort(s['amp'][7:])[::-1][:5] + 8
        print('\nr = %3g..%3g  (%d fiori)' % (r0, r1, s['fiori']))
        print('   piu forti: ' + '  '.join('%d:%.3f' % (m, s['amp'][m-1]) for m in top))
        print('   Fibonacci: ' + '  '.join('%d:%.3f' % (m, s['amp'][m-1])
                                           for m in FIB if m <= 100))

    # I parametri per disegnare l'overlay: la cresta L-esima della famiglia m e'
    #     theta(r) = (2*pi*L - n*u(r) - fase) / m ,   u(r) = (sqrt(r) - mu)/sd
    s = spettro(xs, ys, cx, cy, RMIN, RMAX)
    print('\nparametri per il disegno   u(r) = (sqrt(r) - %.4f) / %.4f' % (s['mu'], s['sd']))
    for m in (34, 55):
        print('   m = %2d   n = %+3d   fase = %+.4f   ampiezza %.3f'
              % (m, s['n'][m-1], s['fase'][m-1], s['amp'][m-1]))
