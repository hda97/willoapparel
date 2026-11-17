// Pita "Contoh demo Willo Studio" di semua halaman demo.
(function(){
  var WA="6285730275488";
  var jenis=document.body.getAttribute("data-demo")||"website";
  var css=".ws-pita{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#141414;color:#fff;border-radius:16px;padding:10px 12px 10px 16px;display:flex;align-items:center;gap:10px;font:600 13px/1.3 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);max-width:560px;margin:0 auto}"+
  ".ws-pita b{color:#FFD24A}.ws-pita span{flex:1}.ws-pita a{flex:none;background:#FFD24A;color:#141414;text-decoration:none;border-radius:10px;padding:9px 12px;font-weight:800}.ws-pita a.k{background:none;color:#fff;padding:9px 4px;font-weight:600;text-decoration:underline}"+
  "body{padding-bottom:84px!important}";
  var s=document.createElement("style");s.textContent=css;document.head.appendChild(s);
  var d=document.createElement("div");d.className="ws-pita";
  var teks=encodeURIComponent("Halo Willo Studio, saya lihat demo "+jenis+". Saya mau dibuatkan yang seperti ini untuk usaha saya.");
  d.innerHTML='<span><b>Contoh demo</b> Willo Studio. Mau yang seperti ini?</span><a class="k" href="/studio/">Demo lain</a><a href="https://wa.me/'+WA+'?text='+teks+'" target="_blank" rel="noopener">Pesan</a>';
  document.body.appendChild(d);
})();
