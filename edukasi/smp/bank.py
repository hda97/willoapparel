#!/usr/bin/env python3
"""Bank soal bawaan paket game SMP Dunia Kotak (Fase D, kelas 7, 8, 9).

Soal dibuat otomatis dengan benih tetap, jadi hasilnya selalu sama di setiap build.
Setiap soal: kelas (7/8/9), topik, soal, a-d, kunci (A-D), jelas (penjelasan singkat).
Guru bisa mengganti semuanya lewat Mode Guru (tempel dari Excel).
"""
import math
import random
from fractions import Fraction

R = random.Random(2027)


SUP = str.maketrans('0123456789', '⁰¹²³⁴⁵⁶⁷⁸⁹')


def pk(a, n):
    return f'{a}' + str(n).translate(SUP)


def fmt(x):
    """Angka gaya Indonesia: minus pakai tanda −, desimal pakai koma."""
    if isinstance(x, Fraction):
        if x.denominator == 1:
            x = x.numerator
        else:
            s = '−' if x < 0 else ''
            return f'{s}{abs(x.numerator)}/{x.denominator}'
    if isinstance(x, float):
        if x.is_integer():
            x = int(x)
        else:
            return (f'{x:.2f}'.rstrip('0').rstrip('.')).replace('-', '−').replace('.', ',')
    if isinstance(x, int):
        return f'{x:,}'.replace(',', '.').replace('-', '−')
    return str(x)


def soal(kelas, topik, teks, benar, salah, jelas=''):
    b = fmt(benar)
    ops, lihat = [b], {b}
    for s in salah:
        s = fmt(s)
        if s not in lihat and len(ops) < 4:
            ops.append(s); lihat.add(s)
    n = 1
    while len(ops) < 4 and isinstance(benar, (int, Fraction)):
        for s in (fmt(benar + n), fmt(benar - n)):
            if s not in lihat and len(ops) < 4:
                ops.append(s); lihat.add(s)
        n += 1
    if len(ops) < 4:
        return None
    R.shuffle(ops)
    return dict(kelas=str(kelas), topik=topik, soal=teks, a=ops[0], b=ops[1], c=ops[2], d=ops[3], kunci='ABCD'[ops.index(b)], jelas=jelas)


def kumpul(fn, n):
    out, lihat = [], set()
    coba = 0
    while len(out) < n and coba < n * 60:
        coba += 1
        s = fn()
        if s and s['soal'] not in lihat:
            lihat.add(s['soal']); out.append(s)
    return out


# ------------------------------- KELAS 7 -------------------------------
def bulat():
    a, b = R.randint(-20, 20), R.randint(-15, 15)
    if not a or not b: return None
    op = R.choice(['+', '−', '×'])
    if op == '+': h, j = a + b, f'{fmt(a)} + ({fmt(b)}) = {fmt(a + b)}.'
    elif op == '−': h, j = a - b, f'Mengurangi sama dengan menambah lawannya: {fmt(a)} + ({fmt(-b)}) = {fmt(a - b)}.'
    else:
        a, b = R.randint(-12, 12), R.randint(-9, 9)
        if not a or not b: return None
        h, j = a * b, 'Tanda sama hasilnya positif, tanda beda hasilnya negatif.'
    sb = f'({fmt(b)})' if b < 0 else fmt(b)
    return soal(7, 'Bilangan Bulat', f'{fmt(a)} {op} {sb} = …', h, [-h, h + R.choice([-2, 2]), h + R.choice([-10, 10])], j)


def bulat_cerita():
    t1, t2 = R.randint(-8, 6), R.randint(4, 15)
    kota = R.choice(['Dieng', 'Puncak Jaya', 'Lembang', 'Bromo'])
    if t1 >= 0: t1 = -R.randint(1, 6)
    return soal(7, 'Bilangan Bulat', f'Suhu pagi di {kota} {fmt(t1)}°C, siang naik {t2}°C. Suhu siang?', t1 + t2, [t2 - t1, t1 - t2, -(t1 + t2)],
                f'{fmt(t1)} + {t2} = {fmt(t1 + t2)}°C.')


def pecahan():
    p, q = Fraction(R.randint(1, 5), R.choice([2, 3, 4, 5, 6])), Fraction(R.randint(1, 5), R.choice([2, 3, 4, 6, 8]))
    if p.denominator == 1 or q.denominator == 1 or p == q: return None
    op = R.choice(['+', '−', '×'])
    h = p + q if op == '+' else p - q if op == '−' else p * q
    salah = [Fraction(p.numerator + q.numerator, p.denominator + q.denominator), h + Fraction(1, h.denominator if h.denominator > 1 else 2), Fraction(p.numerator * q.numerator, p.denominator + q.denominator)]
    j = 'Samakan penyebut dulu, baru jumlahkan pembilangnya.' if op != '×' else 'Kalikan pembilang dengan pembilang, penyebut dengan penyebut.'
    return soal(7, 'Pecahan', f'{fmt(p)} {op} {fmt(q)} = …', h, salah, j + f' Hasilnya {fmt(h)}.')


def desimal_persen():
    x = R.choice([10, 20, 25, 40, 50, 75, 15, 30, 60])
    n = R.choice([40, 60, 80, 120, 200, 160, 240, 300])
    h = Fraction(x * n, 100)
    if h.denominator != 1: return None
    return soal(7, 'Pecahan', f'{x}% dari {n} = …', int(h), [int(h) * 2, n - int(h), int(h) + 10], f'{x}/100 × {n} = {int(h)}.')


def aljabar_sederhana():
    a, b, c, d = R.randint(2, 9), R.randint(1, 9), R.randint(1, 6), R.randint(1, 9)
    v = R.choice(['x', 'y', 'a', 'p'])
    teks = f'Bentuk paling sederhana dari {a}{v} + {b} + {c}{v} − {d} adalah …'
    k = a + c; m = b - d
    f = lambda kk, mm: f"{kk if kk != 1 else ''}{v}" + (f' + {mm}' if mm > 0 else f' − {-mm}' if mm < 0 else '')
    return soal(7, 'Aljabar', teks, f(k, m), [f(k, b + d), f(a - c if a != c else k + 1, m), f(k + m, 0) if k + m else f(k, m + 2)],
                f'Kumpulkan suku sejenis: {a}{v} + {c}{v} = {k}{v}, dan {b} − {d} = {fmt(m)}.')


def substitusi():
    a, b, x = R.randint(2, 7), R.randint(-9, 9), R.randint(-5, 6)
    if not b or not x: return None
    h = a * x + b
    bs = f'+ {b}' if b > 0 else f'− {-b}'
    return soal(7, 'Aljabar', f'Jika x = {fmt(x)}, nilai {a}x {bs} = …', h, [a * x - b, a + x + b, -h], f'{a} × ({fmt(x)}) {bs} = {fmt(h)}.')


def plsv():
    a, x, b = R.randint(2, 9), R.randint(-6, 12), R.randint(1, 20)
    if not x: return None
    c = a * x + b
    return soal(7, 'Persamaan Linear', f'{a}x + {b} = {fmt(c)}. Nilai x = …', x, [Fraction(c + b, a) if (c + b) % a == 0 else x + 2, -x, x + 1],
                f'{a}x = {fmt(c)} − {b} = {fmt(c - b)}, jadi x = {fmt(c - b)} : {a} = {fmt(x)}.')


def plsv_cerita():
    harga, n, sisa = R.choice([2500, 3000, 3500, 4000, 5000]), R.randint(3, 8), R.choice([1000, 2000, 5000])
    uang = harga * n + sisa
    return soal(7, 'Persamaan Linear', f'Raka membawa Rp{fmt(uang)}, membeli {n} buku yang sama, dan sisa Rp{fmt(sisa)}. Harga satu buku?', harga,
                [harga + 500, (uang) // n, harga - 500], f'{n}x + {fmt(sisa)} = {fmt(uang)}, jadi {n}x = {fmt(harga * n)} dan x = {fmt(harga)}.')


def perbandingan():
    a, b = R.randint(2, 7), R.randint(2, 7)
    if a == b or math.gcd(a, b) != 1: return None
    k = R.randint(3, 9)
    tot = (a + b) * k
    return soal(7, 'Perbandingan', f'Perbandingan kelereng Salsa dan Bima {a} : {b}. Jumlahnya {tot}. Kelereng Salsa?', a * k, [b * k, tot // 2, a * k + k],
                f'Satu bagian = {tot} : ({a} + {b}) = {k}. Salsa = {a} × {k} = {a * k}.')


def skala():
    s = R.choice([100000, 200000, 250000, 500000, 1000000])
    cm = R.randint(2, 12)
    km = cm * s / 100000
    return soal(7, 'Perbandingan', f'Pada peta berskala 1 : {fmt(s)}, jarak dua kota {cm} cm. Jarak sebenarnya?', f'{fmt(float(km))} km',
                [f'{fmt(float(km * 10))} km', f'{fmt(float(km / 10))} km', f'{fmt(cm * s // 1000)} km'], f'{cm} × {fmt(s)} cm = {fmt(cm * s)} cm = {fmt(float(km))} km.')


def sudut():
    a = R.randint(20, 160)
    if R.random() < .5:
        return soal(7, 'Sudut', f'Pelurus sudut {a}° adalah …', 180 - a, [90 - a if a < 90 else 360 - a, a, 180 + a], f'Sudut berpelurus jumlahnya 180°: 180° − {a}° = {180 - a}°.')
    a = R.randint(10, 80)
    return soal(7, 'Sudut', f'Penyiku sudut {a}° adalah …', 90 - a, [180 - a, a, 90 + a], f'Sudut berpenyiku jumlahnya 90°: 90° − {a}° = {90 - a}°.')


# ------------------------------- KELAS 8 -------------------------------
def pola():
    a, d = R.randint(1, 12), R.randint(2, 9)
    n = R.randint(8, 25)
    u = [a + d * i for i in range(4)]
    h = a + (n - 1) * d
    return soal(8, 'Pola Bilangan', f'Pola {u[0]}, {u[1]}, {u[2]}, {u[3]}, … Suku ke-{n} adalah …', h, [a + n * d, h - d, n * d],
                f'Beda {d}. Suku ke-n = {a} + (n − 1) × {d}, jadi {a} + {n - 1} × {d} = {h}.')


def gradien():
    x1, y1 = R.randint(-5, 5), R.randint(-5, 5)
    dx, m = R.choice([1, 2, 3, 4]), R.choice([-3, -2, -1, 1, 2, 3])
    x2, y2 = x1 + dx, y1 + m * dx
    return soal(8, 'Persamaan Garis', f'Gradien garis melalui ({fmt(x1)}, {fmt(y1)}) dan ({fmt(x2)}, {fmt(y2)}) adalah …', m,
                [-m, Fraction(dx, m * dx), m * 2], f'm = (y₂ − y₁) : (x₂ − x₁) = {fmt(y2 - y1)} : {dx} = {fmt(m)}.')


def garis_titik():
    m, c = R.choice([-3, -2, 2, 3, 4]), R.randint(-6, 6)
    x = R.randint(-4, 5)
    cs = f'+ {c}' if c > 0 else f'− {-c}' if c < 0 else ''
    return soal(8, 'Persamaan Garis', f'Titik (x, y) dengan x = {fmt(x)} terletak pada garis y = {fmt(m)}x {cs}. Nilai y = …'.replace('  ', ' '), m * x + c,
                [m * x - c, m + x + c, -(m * x + c)], f'y = {fmt(m)} × ({fmt(x)}) {cs} = {fmt(m * x + c)}.')


def spldv():
    x, y = R.randint(-3, 9), R.randint(-3, 9)
    a1, b1, a2, b2 = R.randint(1, 4), R.randint(1, 4), R.randint(1, 4), R.randint(-3, 3)
    if a1 * b2 - a2 * b1 == 0 or b2 == 0: return None
    c1, c2 = a1 * x + b1 * y, a2 * x + b2 * y
    t = lambda a, b, c: f"{a if a != 1 else ''}x {'+' if b > 0 else '−'} {abs(b) if abs(b) != 1 else ''}y = {fmt(c)}"
    return soal(8, 'SPLDV', f'Penyelesaian {t(a1, b1, c1)} dan {t(a2, b2, c2)} adalah …', f'x = {fmt(x)}, y = {fmt(y)}',
                [f'x = {fmt(y)}, y = {fmt(x)}', f'x = {fmt(x + 1)}, y = {fmt(y - 1)}', f'x = {fmt(-x)}, y = {fmt(y)}'], 'Gunakan eliminasi atau substitusi, lalu cek ke kedua persamaan.')


def spldv_cerita():
    p, b = R.choice([2000, 3000, 4000, 5000]), R.choice([1000, 1500, 2500, 3500])
    m1, n1, m2, n2 = R.randint(1, 4), R.randint(1, 4), R.randint(1, 4), R.randint(1, 4)
    if m1 * n2 == m2 * n1: return None
    return soal(8, 'SPLDV', f'{m1} pensil dan {n1} buku Rp{fmt(m1 * p + n1 * b)}. {m2} pensil dan {n2} buku Rp{fmt(m2 * p + n2 * b)}. Harga 1 pensil?', f'Rp{fmt(p)}',
                [f'Rp{fmt(b)}', f'Rp{fmt(p + 500)}', f'Rp{fmt(p + b)}'], f'Eliminasi salah satu barang. Pensil Rp{fmt(p)}, buku Rp{fmt(b)}.')


TRIPEL = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (6, 8, 10), (9, 12, 15), (20, 21, 29), (12, 16, 20)]


def pythagoras():
    a, b, c = R.choice(TRIPEL)
    if R.random() < .5:
        return soal(8, 'Pythagoras', f'Segitiga siku-siku dengan sisi tegak {a} cm dan {b} cm. Panjang sisi miringnya?', f'{c} cm', [f'{a + b} cm', f'{c + 1} cm', f'{abs(b - a) + c // 2} cm'],
                    f'c² = {a}² + {b}² = {a * a + b * b}, jadi c = {c}.')
    return soal(8, 'Pythagoras', f'Sisi miring segitiga siku-siku {c} cm dan satu sisi tegaknya {a} cm. Sisi tegak lainnya?', f'{b} cm', [f'{c - a} cm', f'{b + 2} cm', f'{c + a} cm'],
                f'b² = {c}² − {a}² = {c * c - a * a}, jadi b = {b}.')


def tripel():
    a, b, c = R.choice(TRIPEL)
    k = R.choice([(a, b, c + 1), (a + 1, b, c), (a, b + 2, c)])
    return soal(8, 'Pythagoras', 'Manakah yang merupakan tripel Pythagoras?', f'{a}, {b}, {c}',
                [', '.join(map(str, k)), f'{a + 2}, {b}, {c}', f'{a}, {b + 1}, {c + 1}'], f'{a}² + {b}² = {c}², yaitu {a * a} + {b * b} = {c * c}.')


def statistik():
    n = R.randint(5, 7)
    d = sorted(R.randint(55, 95) for _ in range(n))
    jenis = R.choice(['rata-rata', 'median', 'jangkauan'])
    data = ', '.join(map(str, R.sample(d, n)))
    if jenis == 'rata-rata':
        s = sum(d)
        if s % n: d[-1] += n - s % n; s = sum(d); data = ', '.join(map(str, R.sample(d, n)))
        h = s // n
        return soal(8, 'Statistika', f'Nilai ulangan: {data}. Rata-ratanya?', h, [sorted(d)[n // 2] if sorted(d)[n // 2] != h else h + 3, h + 2, h - 3], f'Jumlah {s} dibagi {n} data = {h}.')
    if jenis == 'median':
        if n % 2 == 0: return None
        h = d[n // 2]
        return soal(8, 'Statistika', f'Data: {data}. Mediannya?', h, [round(sum(d) / n), d[0], d[-1]], f'Urutkan dulu: {", ".join(map(str, d))}. Nilai tengahnya {h}.')
    return soal(8, 'Statistika', f'Data: {data}. Jangkauannya?', d[-1] - d[0], [d[-1], d[-1] + d[0], d[-2] - d[1]], f'Jangkauan = terbesar − terkecil = {d[-1]} − {d[0]} = {d[-1] - d[0]}.')


def luas_permukaan():
    s = R.randint(3, 12)
    if R.random() < .5:
        return soal(8, 'Bangun Ruang', f'Luas permukaan kubus dengan rusuk {s} cm adalah …', f'{fmt(6 * s * s)} cm²', [f'{fmt(s ** 3)} cm²', f'{fmt(4 * s * s)} cm²', f'{fmt(12 * s)} cm²'],
                    f'6 × s² = 6 × {s * s} = {6 * s * s} cm².')
    p, l, t = R.randint(3, 10), R.randint(2, 8), R.randint(2, 9)
    return soal(8, 'Bangun Ruang', f'Volume balok {p} cm × {l} cm × {t} cm adalah …', f'{fmt(p * l * t)} cm³', [f'{fmt(2 * (p * l + p * t + l * t))} cm³', f'{fmt(p + l + t)} cm³', f'{fmt(p * l * t + p * l)} cm³'],
                f'V = p × l × t = {p * l * t} cm³.')


# ------------------------------- KELAS 9 -------------------------------
def pangkat():
    a, m, n = R.choice([2, 3, 5]), R.randint(2, 5), R.randint(1, 4)
    jenis = R.choice(['kali', 'bagi', 'nilai', 'pangkat'])
    if jenis == 'kali':
        return soal(9, 'Perpangkatan', f'{pk(a, m)} × {pk(a, n)} = …', f'{pk(a, m + n)}', [f'{pk(a, m * n)}', f'{pk(a * a, m + n)}', f'{pk(a, abs(m - n))}'], 'Basis sama dikali: pangkat dijumlah.')
    if jenis == 'bagi':
        m2 = m + n
        return soal(9, 'Perpangkatan', f'{pk(a, m2)} : {pk(a, n)} = …', f'{pk(a, m)}', [f'{pk(a, m2 + n)}', f'{pk(a, m2 * n)}', f'{pk(1, m)}'], 'Basis sama dibagi: pangkat dikurangi.')
    if jenis == 'pangkat':
        return soal(9, 'Perpangkatan', f'({pk(a, m)}){str(n).translate(SUP)} = …', f'{pk(a, m * n)}', [f'{pk(a, m + n)}', f'{pk(a * n, m)}', f'{pk(a, m)}'], 'Pangkat dipangkatkan: pangkatnya dikali.')
    b = R.randint(2, 4)
    return soal(9, 'Perpangkatan', f'Nilai dari {pk(b, m)} − {pk(b, 0)} = …', b ** m - 1, [b ** m, b * m - 1, b ** m - b], f'{pk(b, m)} = {b ** m} dan {pk(b, 0)} = 1.')


def akar():
    a = R.randint(2, 15)
    if R.random() < .5:
        return soal(9, 'Perpangkatan', f'√{a * a} = …', a, [a * 2, a * a // 2, a + 1], f'{a} × {a} = {a * a}.')
    k = R.choice([2, 3, 5]); s = R.choice([4, 9, 16, 25])
    r = int(math.isqrt(s))
    return soal(9, 'Perpangkatan', f'Bentuk sederhana √{s * k} adalah …', f'{r}√{k}', [f'{k}√{r}', f'{s}√{k}', f'√{s + k}'], f'√{s * k} = √{s} × √{k} = {r}√{k}.')


def kuadrat():
    p, q = R.randint(-7, 7), R.randint(-7, 7)
    if p == q or not p or not q: return None
    b, c = -(p + q), p * q
    t = 'x²' + (f' + {b}x' if b > 0 else f' − {-b}x' if b < 0 else '') + (f' + {c}' if c > 0 else f' − {-c}')
    t = t.replace(' 1x', ' x')
    return soal(9, 'Persamaan Kuadrat', f'Akar-akar {t} = 0 adalah …', f'{fmt(min(p, q))} dan {fmt(max(p, q))}',
                [f'{fmt(-max(p, q))} dan {fmt(-min(p, q))}', f'{fmt(min(p, q) + 1)} dan {fmt(max(p, q) - 1)}', f'{fmt(p * q)} dan {fmt(p + q)}'],
                f'Cari dua bilangan yang dikali {fmt(c)} dan dijumlah {fmt(-b)}: {fmt(p)} dan {fmt(q)}.')


def transformasi():
    x, y = R.randint(-6, 6), R.randint(-6, 6)
    if not x or not y: return None
    j = R.choice(['sumbu-x', 'sumbu-y', 'translasi'])
    if j == 'sumbu-x':
        return soal(9, 'Transformasi', f'Bayangan titik ({fmt(x)}, {fmt(y)}) dicerminkan terhadap sumbu-x adalah …', f'({fmt(x)}, {fmt(-y)})',
                    [f'({fmt(-x)}, {fmt(y)})', f'({fmt(-x)}, {fmt(-y)})', f'({fmt(y)}, {fmt(x)})'], 'Cermin sumbu-x: x tetap, y berubah tanda.')
    if j == 'sumbu-y':
        return soal(9, 'Transformasi', f'Bayangan titik ({fmt(x)}, {fmt(y)}) dicerminkan terhadap sumbu-y adalah …', f'({fmt(-x)}, {fmt(y)})',
                    [f'({fmt(x)}, {fmt(-y)})', f'({fmt(-x)}, {fmt(-y)})', f'({fmt(y)}, {fmt(x)})'], 'Cermin sumbu-y: y tetap, x berubah tanda.')
    a, b = R.randint(-5, 5), R.randint(-5, 5)
    return soal(9, 'Transformasi', f'Titik ({fmt(x)}, {fmt(y)}) ditranslasi ({fmt(a)}, {fmt(b)}). Bayangannya …', f'({fmt(x + a)}, {fmt(y + b)})',
                [f'({fmt(x - a)}, {fmt(y - b)})', f'({fmt(x + b)}, {fmt(y + a)})', f'({fmt(x * a)}, {fmt(y * b)})'], 'Translasi: tambahkan geseran ke masing-masing koordinat.')


def sebangun():
    a, b, k = R.randint(2, 8), R.randint(3, 10), R.choice([2, 3, 4])
    if a >= b: return None
    return soal(9, 'Kesebangunan', f'Dua persegi panjang sebangun. Yang kecil panjangnya {b} cm dan lebarnya {a} cm. Panjang yang besar {b * k} cm, lebarnya?', f'{a * k} cm',
                [f'{a + b * k - b} cm', f'{a * k + k} cm', f'{b * k - a} cm'], f'Skala {b * k} : {b} = {k}. Lebar = {a} × {k} = {a * k} cm.')


def tabung():
    r, t = R.choice([7, 14, 21]), R.randint(5, 20)
    if R.random() < .5:
        v = 22 * r * r * t // 7
        return soal(9, 'Bangun Ruang Sisi Lengkung', f'Volume tabung berjari-jari {r} cm dan tinggi {t} cm (π = 22/7)?', f'{fmt(v)} cm³',
                    [f'{fmt(2 * 22 * r * t // 7)} cm³', f'{fmt(v * 2)} cm³', f'{fmt(22 * r * t // 7)} cm³'], 'V = π × r² × t.')
    r = R.choice([7, 14])
    l = 4 * 22 * r * r // 7
    return soal(9, 'Bangun Ruang Sisi Lengkung', f'Luas permukaan bola berjari-jari {r} cm (π = 22/7)?', f'{fmt(l)} cm²', [f'{fmt(l // 4)} cm²', f'{fmt(l // 2)} cm²', f'{fmt(4 * 22 * r * r * r // 21)} cm²'], 'L = 4 × π × r².')


def peluang():
    j = R.choice(['dadu', 'kelereng', 'koin'])
    if j == 'dadu':
        k = R.choice([('bilangan genap', 3), ('bilangan prima', 3), ('angka lebih dari 4', 2), ('angka 6', 1), ('kelipatan 3', 2)])
        return soal(9, 'Peluang', f'Sebuah dadu dilempar sekali. Peluang muncul {k[0]}?', Fraction(k[1], 6), [Fraction(k[1] + 1, 6), Fraction(1, k[1] + 1), Fraction(6 - k[1], 6) if k[1] != 3 else Fraction(2, 3)],
                    f'Ada {k[1]} hasil yang cocok dari 6 kemungkinan.')
    if j == 'kelereng':
        m, b, h = R.randint(2, 8), R.randint(2, 8), R.randint(1, 6)
        n = m + b + h
        return soal(9, 'Peluang', f'Kantong berisi {m} kelereng merah, {b} biru, {h} hijau. Peluang terambil biru?', Fraction(b, n), [Fraction(m, n), Fraction(b, n - b) if n - b else Fraction(1, 2), Fraction(1, 3)],
                    f'{b} biru dari {n} kelereng = {fmt(Fraction(b, n))}.')
    n = R.choice([2, 3])
    return soal(9, 'Peluang', f'{n} koin dilempar bersama. Peluang semuanya angka?', Fraction(1, 2 ** n), [Fraction(1, n), Fraction(1, 2), Fraction(n, 2 ** n)], f'Ada {2 ** n} kemungkinan, hanya 1 yang semuanya angka.')


RESEP = {
    7: [(bulat, 12), (bulat_cerita, 5), (pecahan, 10), (desimal_persen, 6), (aljabar_sederhana, 8), (substitusi, 6), (plsv, 10), (plsv_cerita, 5), (perbandingan, 6), (skala, 5), (sudut, 7)],
    8: [(pola, 10), (gradien, 8), (garis_titik, 6), (spldv, 8), (spldv_cerita, 6), (pythagoras, 12), (tripel, 4), (statistik, 12), (luas_permukaan, 10)],
    9: [(pangkat, 12), (akar, 8), (kuadrat, 12), (transformasi, 12), (sebangun, 8), (tabung, 10), (peluang, 12)],
}


def bank():
    out = []
    for kelas, resep in RESEP.items():
        for fn, n in resep:
            out += kumpul(fn, n)
    return out


if __name__ == '__main__':
    b = bank()
    from collections import Counter
    print(len(b), Counter(s['kelas'] for s in b), Counter(s['topik'] for s in b))
    for s in R.sample(b, 12):
        print(s['kelas'], s['topik'], '|', s['soal'], '|', s['a'], '/', s['b'], '/', s['c'], '/', s['d'], '=>', s['kunci'])
