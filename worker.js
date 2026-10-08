// Dipanggil hanya jika tidak ada file yang cocok, misalnya "/" atau "/folder/".
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/")) {
      url.pathname += "index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return new Response("Halaman tidak ditemukan", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
