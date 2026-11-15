/* Ikon Lumbung by Willo Studio — digambar sendiri (Huda 15 Nov 2026: "Icon saya tidak mau dari icon emot atau standart").
   Setiap emoji di teks halaman otomatis diganti gambar SVG bergaya Willo: garis biru tua, aksen kuning.
   Tambah ikon baru: tulis gambar 24×24 di daftar G, lalu petakan emojinya di PETA. */
(function(){
  "use strict";
  var KUNING = "#ffd23f", BIRU = "#1f4fd8";
  // k = bidang aksen kuning, b = bidang biru, p = garis
  function k(d){ return '<path d="' + d + '" fill="' + KUNING + '"/>'; }
  function b(d){ return '<path d="' + d + '" fill="' + BIRU + '" stroke="none"/>'; }
  function p(d){ return '<path d="' + d + '"/>'; }
  function c(x, y, r, isi){ return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"' + (isi ? ' fill="' + isi + '"' : '') + '/>'; }
  function t(x, y, s, isi, uk){ return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="' + (uk || 8) + '" fill="' + (isi || "currentColor") + '" stroke="none">' + s + '</text>'; }
  var KAOS = "M8.5 4 5 5.5 2 9.5l2.6 2.6L6.5 11v9h11v-9l1.9 1.1L22 9.5 19 5.5 15.5 4c-.6 1.6-2 2.4-3.5 2.4S9.1 5.6 8.5 4Z";
  var G = {
    // ——— navigasi & aksi ———
    kiri: p("M19 12H5M11 6l-6 6 6 6"),
    kanan: p("M5 12h14M13 6l6 6-6 6"),
    unduh: k("M5 17h14v3H5z") + p("M12 3v11M7 9.5l5 5 5-5M4 17v3h16v-3"),
    tambah: k("M3 3h18v18H3z") + p("M12 7.5v9M7.5 12h9"),
    kurang: k("M3 3h18v18H3z") + p("M7.5 12h9"),
    centang: p("M4.5 12.5l4.5 4.5L19.5 6.5"),
    centangKotak: k("M3 3h18v18H3z") + p("M3 3h18v18H3zM7.5 12.5l3 3 6-6.5"),
    silang: p("M6 6l12 12M18 6 6 18"),
    pensil: k("m14.5 5.5 4 4L9 19l-5 1 1-5z") + p("m14.5 5.5 4 4L9 19l-5 1 1-5zM12.5 7.5l4 4M16.5 3.5l4 4-2 2-4-4z"),
    sampah: k("M6.5 7h11l-1 13h-9z") + p("M4 7h16M9.5 7V4h5v3M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"),
    simpan: k("M7 3h9v6H7z") + p("M4 3h13l3 3v15H4zM7 3v6h9V3M7 14h10v7H7z"),
    folder: k("M3 8h18v12H3z") + p("M3 5h7l2 3h9v12H3z"),
    dokumen: k("M14 3v5h5") + p("M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h5"),
    struk: k("M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z") + p("M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h3"),
    printer: k("M7 14h10v7H7z") + p("M7 9V3h10v6M4 9h16v8h-3M7 17H4V9M7 14h10v7H7zM17 12h.01"),
    cari: k("M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z") + c(10.5, 10.5, 6.5) + p("m15.5 15.5 5 5"),
    sinyal: k("M3 17h3v4H3z") + p("M3 17h3v4H3zM9 13h3v8H9zM15 9h3v12h-3zM21 4v17"),
    toa: k("M4 9.5h4l8-5v15l-8-5H4z") + p("M4 9.5h4l8-5v15l-8-5H4zM8 14.5l1.5 5h3l-1-4.5M19 9a4 4 0 0 1 0 6"),
    ulang: p("M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5"),
    layar: k("M3 4h18v12H3z") + p("M3 4h18v12H3zM8 21h8M12 16v5"),
    suara: k("M4 9h4l5-4v14l-5-4H4z") + p("M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"),
    grafik: k("M10 9h4v11h-4z") + p("M4 20h16M5 20v-6h4v6M10 20V9h4v11M15 20V4h4v16"),
    tangan: k("M7 11V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V13l1.2-2a1.6 1.6 0 0 1 2.8 1.6L17 18a5 5 0 0 1-4.5 3H11a5 5 0 0 1-5-5v-4.5a1.5 1.5 0 0 1 1-1.4") + p("M10 11V4a1.5 1.5 0 0 1 3 0v7M13 11V5.5a1.5 1.5 0 0 1 3 0V13l1.2-2a1.6 1.6 0 0 1 2.8 1.6L17 18a5 5 0 0 1-4.5 3H11a5 5 0 0 1-5-5V7.5a1.5 1.5 0 0 1 3 0V12M7 11V5.5"),
    gambar: k("m3 18 5-6 4 4 3-3 6 5z") + p("M3 4h18v16H3zM3 18l5-6 4 4 3-3 6 5") + c(16, 8.5, 1.6),
    kamera: k("M12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z") + p("M3 7h4l2-3h6l2 3h4v13H3z") + c(12, 13, 4),
    toko: k("M3 9h18l-1.5-5h-15z") + p("M3 9h18l-1.5-5h-15zM3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5"),
    masuk: k("M4 15h16v5H4z") + p("M4 15v5h16v-5M12 3v11M7 9l5 5 5-5"),
    obrolan: k("M4 5h16v11H9l-5 4z") + p("M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5"),
    uang: k("M2 7h20v10H2z") + p("M2 7h20v10H2z") + c(12, 12, 2.6) + p("M5.5 10v4M18.5 10v4"),
    bank: k("M3 9 12 4l9 5z") + p("M3 9l9-5 9 5zM5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 20h18"),
    kartu: k("M2 9h20v3H2z") + p("M2 5h20v14H2zM2 9h20M5.5 15.5h4"),
    awas: k("M12 3 2 20h20z") + p("M12 3 2 20h20zM12 9.5v5M12 17.5h.01"),
    terimakasih: k("M12 21c-4-3-8-6.5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4.5-4 8-8 11z") + p("M12 21c-4-3-8-6.5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4.5-4 8-8 11z"),
    pesta: k("m3 21 4-12 8 8z") + p("m3 21 4-12 8 8zM14 4v2M19 9h2M17 6.5 18.5 5M13 9.5c1.5-1 2.5-2.5 2.5-4.5M14.5 11c1-1.5 2.5-2 4.5-2"),
    kalender: k("M3 5h18v5H3z") + p("M3 5h18v16H3zM3 10h18M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"),
    buku: k("M5 3h13v15H5z") + p("M5 3h14v18H7a2 2 0 0 1-2-2zM5 19a2 2 0 0 1 2-2h12M9 7.5h6"),
    angka: k("M3 4h18v16H3z") + p("M3 4h18v16H3z") + t(12, 15.5, "123", null, 7.5),
    keranjang: k("M6 7h15l-2 8H8z") + p("M2 3h3l3 12h11l2-8H6M10 19.5h.01M17 19.5h.01") + c(10, 19.5, 1.4) + c(17, 19.5, 1.4),
    perkakas: k("m14 4 6 6-3 3-6-6z") + p("m14 4 6 6-3 3-6-6zM11 7 3.5 14.5a2 2 0 0 0 3 3L14 10M5 5l3 3M4 8l4-4"),
    salaman: k("M2 12l4-5 4 2 3-2 3 1 6 4-4 5-6-3z") + p("M2 12l4-5 4 2M22 12l-6-4-3 1-4 3a1.5 1.5 0 0 0 2 2l3-1.5 4 4.5M18 17l-3-3M15 19l-2.5-2.5M2 12l3 4"),
    kotak: k("M3 8 12 4l9 4-9 4z") + p("M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9M7.5 6l9 4"),
    pekerja: k("M6 11a6 6 0 0 1 12 0z") + p("M4 11h16M6 11a6 6 0 0 1 12 0M12 5V3M8 11a4 4 0 0 0 8 0M5 21a7 7 0 0 1 14 0"),
    rumah: k("M5 10v10h14V10l-7-6z") + p("M3 11.5 12 4l9 7.5M5 10v10h14V10M10 20v-6h4v6"),
    lampu: k("M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z") + p("M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3zM9 19h6M10 21.5h4"),
    motor: k("M8 13h7l2-4h-4z") + p("M5 17h9l3-5h-4M14 9h3l2.5 8M8 13h6") + c(5, 17, 3) + c(19.5, 17, 3),
    dompet: k("M3 7h18v13H3z") + p("M3 7h18v13H3zM3 7l13-4v4M16 13.5h2.5") + c(16.5, 13.5, .3),
    tumpukanBuku: k("M4 15h16v5H4z") + p("M4 15h16v5H4zM5 10h14v5H5zM4 5h16v5H4z"),
    kampung: k("M2 12 7 8l5 4v8H2z") + p("M2 12l5-4 5 4v8H2zM12 11l5-4 5 4v9H12M5 20v-4h4v4M15 14h3"),
    jam: k("M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z") + c(12, 12, 8) + p("M12 7.5V12l3 2"),
    piala: k("M7 3h10v6a5 5 0 0 1-10 0z") + p("M7 3h10v6a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"),
    petir: k("M13 2 4 14h7l-1 8 9-12h-7z") + p("M13 2 4 14h7l-1 8 9-12h-7z"),
    colokan: k("M7 7h10v5a5 5 0 0 1-10 0z") + p("M7 7h10v5a5 5 0 0 1-10 0zM9.5 7V3M14.5 7V3M12 17v4"),
    baterai: k("M5 9h8v6H5z") + p("M3 7h16v10H3zM21 10.5v3"),
    gembok: k("M5 11h14v10H5z") + p("M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 8 0V11M12 15v2"),
    gembokBuka: k("M5 11h14v10H5z") + p("M5 11h14v10H5zM8 11V7.5a4 4 0 0 1 7.7-1.5M12 15v2"),
    hp: k("M9 18h6") + p("M7 2h10v20H7zM10.5 18.5h3M10 5h4"),
    // ——— barang (untuk contoh jenis usaha) ———
    kaos: k(KAOS) + p(KAOS),
    kaosOlahraga: k(KAOS) + p(KAOS + "M9 13h6"),
    jaket: k("M8.5 4 5 5.5 3 20h5V9.5L12 7l4 2.5V20h5L19 5.5 15.5 4 12 7z") + p("M8.5 4 5 5.5 3 20h5V9.5L12 7l4 2.5V20h5L19 5.5 15.5 4 12 7zM12 7v13M8 20h8"),
    gaun: k("M9 3h6l-1 5 5 13H5l5-13z") + p("M9 3h6l-1 5 5 13H5l5-13zM10 8h4"),
    topi: k("M4 15a8 8 0 0 1 16 0z") + p("M4 15a8 8 0 0 1 16 0zM2 15h20l-1 3H3zM12 7V5"),
    sepatu: k("M3 16V9l4 1 3-3 4 4 7 2v3z") + p("M3 16V9l4 1 3-3 4 4 7 2v3zM2.5 16h19v3h-19zM9 10.5l1.5 1.5M11.5 9.5 13 11"),
    nasi: k("M4 12h16a8 8 0 0 1-16 0z") + p("M3 12h18a9 9 0 0 1-18 0zM7 12a5 3 0 0 1 10 0M9 21h6"),
    mie: k("M3 11h18a9 9 0 0 1-18 0z") + p("M3 11h18a9 9 0 0 1-18 0zM15 3l-4 8M20 3l-6 8M7 11c1-2 2-2 3 0s2 2 3 0 2-2 3 0"),
    ayam: k("M14 4a5 5 0 0 1 4 8l-5 5-4-4 5-5a5 5 0 0 1 0-4z") + p("M14 4a5 5 0 0 1 4 8l-5 5-4-4 5-5M9 13l-4 4M5 17a2 2 0 1 0-1 3 2 2 0 1 0 3-1"),
    sate: k("M8 6h4v3H8zM10 11h4v3h-4zM12 16h4v3h-4z") + p("M3 3l18 18M8 6h4v3H8zM10 11h4v3h-4zM12 16h4v3h-4z"),
    pangsit: k("M3 15c3-8 15-8 18 0z") + p("M3 15c3-8 15-8 18 0zM3 15h18M8 10.5l1 4.5M12 9v6M16 10.5l-1 4.5"),
    roti: k("M4 11a4 4 0 0 1 2-7.5h12A4 4 0 0 1 20 11v9H4z") + p("M4 11a4 4 0 0 1 2-7.5h12A4 4 0 0 1 20 11v9H4zM9 9v3M15 9v3"),
    kue: k("M4 12h16v8H4z") + p("M4 12h16v8H4zM4 15.5c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0M8 12V9M12 12V9M16 12V9M8 6v.5M12 6v.5M16 6v.5"),
    donat: k("M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z") + c(12, 12, 8) + c(12, 12, 2.6, "#fff") + p("M8 7.5l.5 1M15.5 7l-.5 1M17 13h-1M7 14.5l1-.5"),
    kopi: k("M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z") + p("M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h2a2.5 2.5 0 0 1 0 5h-2M8 3c-1 1.3 1 2 0 3.5M12 3c-1 1.3 1 2 0 3.5"),
    esteh: k("M6 8h12l-1.5 13h-9z") + p("M5 8h14M6 8l1.5 13h9L18 8M13 8l2-5h3M9 13h6"),
    gelas: k("M6 10h12l-1.5 11h-9z") + p("M5 4h14l-2.5 17h-9zM6 10h12"),
    minumanKotak: k("M6 8h11v13H6z") + p("M6 8h11v13H6zM6 8l2-3h11l-2 3M19 5v12l-2 4M14 5l1-3h3"),
    jus: k("M6 9h12l-2 12H8z") + p("M5 9h14M6 9l2 12h8l2-9M12 9l3-6M7 5a3 3 0 0 1 5 0"),
    esKrim: k("M7 10a5 5 0 0 1 10 0z") + p("M7 10a5 5 0 0 1 10 0zM6 10h12l-6 11z"),
    pisang: k("M5 5c0 9 5 14 15 13-2 3-6 3-9 2C6 18 4 12 5 5z") + p("M5 5c0 9 5 14 15 13-2 3-6 3-9 2C6 18 4 12 5 5zM5 5 4 3"),
    telur: k("M12 3c3.5 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.5-10 6-10z") + p("M12 3c3.5 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.5-10 6-10z"),
    garam: k("M7 10h10v11H7z") + p("M7 10h10v11H7zM8 10l1-6h6l1 6M11 6.5h.01M13 6.5h.01"),
    minyak: k("M7 10h10v11H7z") + p("M7 10h10v11H7zM9 10V6h6v4M10 6V3h4v3M10 15.5h4"),
    coklat: k("M5 3h14v18H5z") + p("M5 3h14v18H5zM5 9h14M5 15h14M12 3v18"),
    permen: k("M8 8a5.6 5.6 0 0 1 8 8 5.6 5.6 0 0 1-8-8z") + p("M8 8a5.6 5.6 0 0 1 8 8 5.6 5.6 0 0 1-8-8zM8 8 3 3v5h3M16 16l5 5v-5h-3"),
    kerupuk: k("M12 3l2.5 3 3.8-.5-.5 3.8L21 12l-3 2.5.5 3.8-3.8-.5L12 21l-2.5-3-3.8.5.5-3.8L3 12l3-2.5-.5-3.8 3.8.5z") + p("M12 3l2.5 3 3.8-.5-.5 3.8L21 12l-3 2.5.5 3.8-3.8-.5L12 21l-2.5-3-3.8.5.5-3.8L3 12l3-2.5-.5-3.8 3.8.5z"),
    kukis: k("M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z") + p("M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3zM8 10h.01M9 15h.01M14 15h.01M12.5 12h.01"),
    potongRambut: k("M5 3h4v8H5z") + p("M5 3h4v18H5zM5 7l4 2M5 11l4 2M5 15l4 2M14 5h5M14 9h5M14 13h5"),
    kunci: k("M15 3a6 6 0 0 0-5.6 8.2L3 17.5V21h3.5v-2h2v-2h2l1.5-1.5A6 6 0 1 0 15 3z") + p("M15 3a6 6 0 0 0-5.6 8.2L3 17.5V21h3.5v-2h2v-2h2l1.5-1.5A6 6 0 1 0 15 3z") + c(16, 8, 1.4),
    botol: k("M8 10h8v11H8z") + p("M8 10h8v11H8zM9 10c0-2 1-3 1-5V3h4v2c0 2 1 3 1 5M8 14h8"),
    sabun: k("M4 11h16v9H4z") + p("M4 11h16v9H4zM8 7a2 2 0 1 0 0-.1M14 5a2.5 2.5 0 1 0 0-.1M17 8.5a1.3 1.3 0 1 0 0-.1"),
    gunting: c(6, 17, 3, KUNING) + c(18, 17, 3, KUNING) + c(6, 17, 3) + c(18, 17, 3) + p("M8 15 18 3M16 15 6 3"),
    bensin: k("M4 4h10v17H4z") + p("M4 4h10v17H4zM4 10h10M14 8l4 3v7a1.5 1.5 0 0 0 3 0V7l-3-3"),
    hadiah: k("M4 10h16v11H4z") + p("M3 7h18v4H3zM4 11v10h16V11M12 7v14M12 7c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"),
    kasur: k("M3 11h18v6H3z") + p("M3 11h18v6H3zM3 17v3M21 17v3M5 11V7h6v4M13 11V7h6v4"),
    ban: k("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z") + c(12, 12, 9) + c(12, 12, 4, "#fff") + p("M12 3v5M12 16v5M3 12h5M16 12h5"),
    senbei: k("M4 7h16a2 2 0 0 1 0 10H4a2 2 0 0 1 0-10z") + p("M4 7h16a2 2 0 0 1 0 10H4a2 2 0 0 1 0-10zM9 7v10M15 7v10"),
    gerigi: c(12, 12, 3.2, KUNING) + p("M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1") + c(12, 12, 6.5) + c(12, 12, 3.2),
    kalkulator: k("M7 5h10v4H7z") + p("M5 2.5h14v19H5zM7 5h10v4H7zM8 12.5h.01M12 12.5h.01M16 12.5h.01M8 16h.01M12 16h.01M16 16v3M8 19h4")
  };
  // Emoji → nama ikon. Varian FE0F diabaikan.
  var PETA = {
    "←":"kiri","→":"kanan","⬇":"unduh","➕":"tambah","➖":"kurang","✓":"centang","✔":"centang","✅":"centangKotak","✕":"silang","✖":"silang","❌":"silang",
    "✏":"pensil","🗑":"sampah","💾":"simpan","📂":"folder","📁":"folder","📄":"dokumen","📃":"dokumen","🧾":"struk","🖨":"printer","🔍":"cari","🔎":"cari","📶":"sinyal",
    "📢":"toa","📣":"toa","🔁":"ulang","🔄":"ulang","🖥":"layar","💻":"layar","🔊":"suara","📊":"grafik","📈":"grafik","✋":"tangan","🖼":"gambar","📷":"kamera","📸":"kamera",
    "🏪":"toko","📥":"masuk","💬":"obrolan","💵":"uang","💰":"uang","🏦":"bank","💳":"kartu","⚠":"awas","🙏":"terimakasih","🎉":"pesta","📅":"kalender","📆":"kalender",
    "📒":"buku","📕":"buku","📗":"buku","🔢":"angka","🛒":"keranjang","🛠":"perkakas","🔧":"kunci","🤝":"salaman","📦":"kotak","👷":"pekerja","🏠":"rumah","🏡":"rumah",
    "💡":"lampu","🛵":"motor","👛":"dompet","📚":"tumpukanBuku","🏘":"kampung","⏰":"jam","🏆":"piala","⚡":"petir","🔌":"colokan","🔋":"baterai","📱":"hp","🔒":"gembok","🔐":"gembok","🔓":"gembokBuka",
    "👕":"kaos","🎽":"kaosOlahraga","🧥":"jaket","👗":"gaun","👚":"kaos","🧢":"topi","👟":"sepatu","🍚":"nasi","🍜":"mie","🍗":"ayam","🍢":"sate","🥟":"pangsit","🍞":"roti",
    "🍰":"kue","🍩":"donat","☕":"kopi","🧋":"esteh","🥤":"gelas","🧃":"minumanKotak","🍹":"jus","🍦":"esKrim","🍌":"pisang","🥚":"telur","🧂":"garam","🛢":"minyak",
    "🍫":"coklat","🍬":"permen","🍘":"senbei","🍪":"kukis","💈":"potongRambut","🧴":"botol","🧼":"sabun","✂":"gunting","⛽":"bensin","🎁":"hadiah","🛏":"kasur","🛞":"ban","⚙":"gerigi","🧮":"kalkulator"
  };
  function svg(nama){
    return '<svg class="lik" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + G[nama] + '</svg>';
  }
  var kunciPeta = Object.keys(PETA).sort(function(a, z){ return z.length - a.length; }).map(function(x){ return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
  var POLA = new RegExp("(" + kunciPeta.join("|") + ")\\uFE0F?", "g");
  var LEWATI = { SCRIPT:1, STYLE:1, TEXTAREA:1, OPTION:1, TITLE:1, PRE:1, INPUT:1, SELECT:1, svg:1, SVG:1 };
  function ganti(akar){
    if (!akar) return;
    var jalan = document.createTreeWalker(akar, NodeFilter.SHOW_TEXT, { acceptNode: function(n){
      for (var e = n.parentNode; e && e !== akar.parentNode; e = e.parentNode) { if (LEWATI[e.nodeName] || (e.hasAttribute && e.hasAttribute("data-teks"))) return NodeFilter.FILTER_REJECT; }
      POLA.lastIndex = 0; return POLA.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    } }), daftar = [];
    while (jalan.nextNode()) daftar.push(jalan.currentNode);
    daftar.forEach(function(n){
      var f = document.createDocumentFragment(), s = n.nodeValue, akhir = 0; POLA.lastIndex = 0; var m;
      while ((m = POLA.exec(s))) {
        if (m.index > akhir) f.appendChild(document.createTextNode(s.slice(akhir, m.index)));
        var sp = document.createElement("span"); sp.className = "lik-b"; sp.setAttribute("data-e", m[1]); sp.innerHTML = svg(PETA[m[1]]); f.appendChild(sp);
        akhir = m.index + m[0].length;
      }
      if (akhir < s.length) f.appendChild(document.createTextNode(s.slice(akhir)));
      n.parentNode.replaceChild(f, n);
    });
  }
  function gaya(){
    var st = document.createElement("style");
    st.textContent = ".lik-b{display:inline-flex;width:1.2em;height:1.2em;vertical-align:-.25em;color:currentColor;flex:0 0 auto}.lik-b .lik{width:100%;height:100%}";
    document.head.appendChild(st);
  }
  window.LumbungIkon = { svg: function(e){ var n = PETA[String(e).replace(/️/g, "")]; return n ? svg(n) : null; }, ganti: ganti, ada: function(e){ return !!PETA[String(e).replace(/️/g, "")]; } };
  function mulai(){
    gaya(); ganti(document.body);
    var antre = false;
    new MutationObserver(function(){ if (antre) return; antre = true; requestAnimationFrame(function(){ antre = false; ganti(document.body); }); })
      .observe(document.body, { childList:true, subtree:true, characterData:true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mulai); else mulai();
})();
