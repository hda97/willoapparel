// Kelas Dunia Kotak: laptop guru menjadi server lokal untuk paket game SMP.
//
// Guru cukup mengklik dua kali aplikasi ini. Browser laptop terbuka ke layar guru,
// murid membuka alamat yang tampil (atau scan QR) dari HP yang tersambung ke WiFi yang sama.
// Tidak perlu internet. Logika permainan berjalan di browser guru; server ini hanya
// menyajikan berkas game dan meneruskan pesan antara layar guru dan HP murid.
//
// Rakit: python3 edukasi/smp/build.py --server
package main

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sort"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/coder/websocket"
)

//go:embed dist
var berkas embed.FS

const maksMurid = 120

type murid struct {
	ID    string          `json:"id"`
	Token string          `json:"-"`
	Nama  string          `json:"nama"`
	Rupa  json.RawMessage `json:"rupa"`
	Tim   int             `json:"tim"`
	On    bool            `json:"on"`
	urut  int
	conn  *koneksi
}

type koneksi struct {
	ws    *websocket.Conn
	kirim chan []byte
}

type hub struct {
	mu       sync.Mutex
	guru     *koneksi
	murid    map[string]*murid // id -> murid
	token    map[string]string // token -> id
	terakhir []byte            // siaran terakhir guru (lobi/soal) untuk murid yang baru masuk
	urut     int
	game     string
}

var H = &hub{murid: map[string]*murid{}, token: map[string]string{}}

func acakHex(n int) string { b := make([]byte, n); rand.Read(b); return hex.EncodeToString(b) }

func (k *koneksi) tulis(b []byte) {
	select {
	case k.kirim <- b:
	default: // antrean penuh: HP terlalu lambat, lewati pesan ini
	}
}

func pompa(ctx context.Context, k *koneksi) {
	for {
		select {
		case <-ctx.Done():
			return
		case b := <-k.kirim:
			c, batal := context.WithTimeout(ctx, 5*time.Second)
			err := k.ws.Write(c, websocket.MessageText, b)
			batal()
			if err != nil {
				return
			}
		}
	}
}

// daftar murid dikirim ke guru setiap ada perubahan (harus dipanggil saat mu dikunci)
func (h *hub) laporKeGuru() {
	if h.guru == nil {
		return
	}
	d := make([]*murid, 0, len(h.murid))
	for _, m := range h.murid {
		d = append(d, m)
	}
	sort.Slice(d, func(i, j int) bool { return d[i].urut < d[j].urut })
	b, _ := json.Marshal(map[string]any{"t": "murid", "daftar": d})
	h.guru.tulis(b)
}

func bersihNama(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	var b strings.Builder
	for _, r := range s {
		if r < 32 || r == '<' || r == '>' {
			continue
		}
		b.WriteRune(r)
	}
	s = b.String()
	if utf8.RuneCountInString(s) > 14 {
		s = string([]rune(s)[:14])
	}
	return s
}

func layaniWS(w http.ResponseWriter, r *http.Request) {
	peran := r.URL.Query().Get("peran")
	if peran == "guru" && !dariLaptopIni(r) {
		http.Error(w, "Layar guru hanya bisa dibuka dari laptop guru.", http.StatusForbidden)
		return
	}
	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	ws.SetReadLimit(64 * 1024)
	ctx, batal := context.WithCancel(r.Context())
	defer batal()
	k := &koneksi{ws: ws, kirim: make(chan []byte, 64)}
	go pompa(ctx, k)
	if peran == "guru" {
		layaniGuru(ctx, k)
	} else {
		layaniMurid(ctx, k)
	}
	ws.Close(websocket.StatusNormalClosure, "")
}

func layaniGuru(ctx context.Context, k *koneksi) {
	H.mu.Lock()
	if H.guru != nil {
		H.guru.ws.Close(websocket.StatusPolicyViolation, "layar guru dibuka di tab lain")
	}
	H.guru = k
	H.laporKeGuru()
	H.mu.Unlock()
	log.Println("Layar guru tersambung.")
	defer func() {
		H.mu.Lock()
		if H.guru == k {
			H.guru = nil
		}
		H.mu.Unlock()
	}()
	for {
		_, b, err := k.ws.Read(ctx)
		if err != nil {
			return
		}
		var m struct {
			T    string          `json:"t"`
			ID   string          `json:"id"`
			Data json.RawMessage `json:"data"`
		}
		if json.Unmarshal(b, &m) != nil {
			continue
		}
		H.mu.Lock()
		switch m.T {
		case "game":
			var g struct {
				ID string `json:"id"`
			}
			json.Unmarshal(b, &g)
			if H.game != g.ID {
				// game lain dipilih: mulai kelas baru
				H.game = g.ID
			}
		case "siar":
			var t struct {
				T string `json:"t"`
			}
			json.Unmarshal(m.Data, &t)
			if t.T == "lobi" || t.T == "tutup" {
				H.terakhir = m.Data
			}
			if t.T == "tutup" {
				H.terakhir = nil
			}
			for _, md := range H.murid {
				if md.conn != nil {
					md.conn.tulis(m.Data)
				}
			}
		case "ke":
			if md, ok := H.murid[m.ID]; ok && md.conn != nil {
				md.conn.tulis(m.Data)
			}
		case "tendang":
			if md, ok := H.murid[m.ID]; ok {
				if md.conn != nil {
					md.conn.tulis([]byte(`{"t":"dikeluarkan"}`))
				}
				delete(H.token, md.Token)
				delete(H.murid, m.ID)
				H.laporKeGuru()
			}
		case "kosongkan":
			for _, md := range H.murid {
				if md.conn != nil {
					md.conn.tulis([]byte(`{"t":"tutup"}`))
				}
			}
			H.murid = map[string]*murid{}
			H.token = map[string]string{}
			H.laporKeGuru()
		}
		H.mu.Unlock()
	}
}

func layaniMurid(ctx context.Context, k *koneksi) {
	var saya *murid
	H.mu.Lock()
	if H.terakhir != nil {
		k.tulis(H.terakhir)
	} else {
		k.tulis([]byte(`{"t":"tunggu-guru"}`))
	}
	H.mu.Unlock()
	defer func() {
		if saya == nil {
			return
		}
		H.mu.Lock()
		if saya.conn == k {
			saya.conn = nil
			saya.On = false
			H.laporKeGuru()
		}
		H.mu.Unlock()
	}()
	for {
		_, b, err := k.ws.Read(ctx)
		if err != nil {
			return
		}
		var m struct {
			T     string          `json:"t"`
			Token string          `json:"token"`
			Nama  string          `json:"nama"`
			Rupa  json.RawMessage `json:"rupa"`
			Tim   *int            `json:"tim"`
			H     string          `json:"h"`
			No    int             `json:"no"`
		}
		if json.Unmarshal(b, &m) != nil {
			continue
		}
		H.mu.Lock()
		switch m.T {
		case "gabung":
			nama := bersihNama(m.Nama)
			if utf8.RuneCountInString(nama) < 2 {
				k.tulis([]byte(`{"t":"ditolak","alasan":"Nama minimal 2 huruf"}`))
				break
			}
			if id, ok := H.token[m.Token]; ok && m.Token != "" {
				saya = H.murid[id]
			}
			if saya == nil {
				if len(H.murid) >= maksMurid {
					// kelas penuh: beri tempat dengan melepas murid yang sudah lama terputus
					var lama *murid
					for _, x := range H.murid {
						if x.conn == nil && (lama == nil || x.urut < lama.urut) {
							lama = x
						}
					}
					if lama != nil {
						delete(H.token, lama.Token)
						delete(H.murid, lama.ID)
					}
				}
				if len(H.murid) >= maksMurid {
					k.tulis([]byte(`{"t":"ditolak","alasan":"Kelas sudah penuh"}`))
					break
				}
				// nama kembar: tambahkan angka
				dasar, n := nama, 2
				for ada := true; ada; {
					ada = false
					for _, x := range H.murid {
						if strings.EqualFold(x.Nama, nama) {
							ada = true
							nama = fmt.Sprintf("%s %d", dasar, n)
							n++
							break
						}
					}
				}
				H.urut++
				saya = &murid{ID: "m" + acakHex(4), Token: acakHex(12), Nama: nama, urut: H.urut, Tim: -1}
				H.murid[saya.ID] = saya
				H.token[saya.Token] = saya.ID
			}
			if len(m.Rupa) > 0 && len(m.Rupa) < 300 {
				saya.Rupa = m.Rupa
			}
			if m.Tim != nil {
				saya.Tim = *m.Tim
			}
			if saya.conn != nil && saya.conn != k {
				saya.conn.ws.Close(websocket.StatusPolicyViolation, "masuk dari perangkat lain")
			}
			saya.conn = k
			saya.On = true
			bal, _ := json.Marshal(map[string]any{"t": "halo", "id": saya.ID, "token": saya.Token, "nama": saya.Nama})
			k.tulis(bal)
			H.laporKeGuru()
		case "jawab":
			if saya != nil && H.guru != nil && len(m.H) == 1 {
				bal, _ := json.Marshal(map[string]any{"t": "jawab", "id": saya.ID, "h": m.H, "no": m.No})
				H.guru.tulis(bal)
			}
		}
		H.mu.Unlock()
	}
}

func dariLaptopIni(r *http.Request) bool {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return false
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

// alamat IPv4 jaringan lokal laptop (WiFi/LAN), yang paling mungkin dipakai murid di urutan pertama
func alamatLokal() []string {
	var hasil []string
	ifs, _ := net.Interfaces()
	for _, i := range ifs {
		if i.Flags&net.FlagUp == 0 || i.Flags&net.FlagLoopback != 0 {
			continue
		}
		nm := strings.ToLower(i.Name)
		if strings.Contains(nm, "vmware") || strings.Contains(nm, "virtualbox") || strings.Contains(nm, "vbox") || strings.HasPrefix(nm, "docker") || strings.HasPrefix(nm, "veth") || strings.HasPrefix(nm, "br-") {
			continue
		}
		addrs, _ := i.Addrs()
		for _, a := range addrs {
			ipn, ok := a.(*net.IPNet)
			if !ok || ipn.IP.To4() == nil || ipn.IP.IsLinkLocalUnicast() {
				continue
			}
			hasil = append(hasil, ipn.IP.String())
		}
	}
	nilai := func(s string) int {
		switch {
		case strings.HasPrefix(s, "192.168."):
			return 0
		case strings.HasPrefix(s, "10."):
			return 1
		case strings.HasPrefix(s, "172."):
			return 2
		}
		return 3
	}
	sort.SliceStable(hasil, func(i, j int) bool { return nilai(hasil[i]) < nilai(hasil[j]) })
	if len(hasil) == 0 {
		hasil = []string{"127.0.0.1"}
	}
	return hasil
}

func bukaBrowser(url string) {
	var c *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		c = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		c = exec.Command("open", url)
	default:
		c = exec.Command("xdg-open", url)
	}
	c.Start()
}

func main() {
	log.SetFlags(log.Ltime)
	sub, _ := fs.Sub(berkas, "dist")
	baca := func(nama string) []byte { b, _ := fs.ReadFile(sub, nama); return b }
	sajikan := func(nama string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.Write(baca(nama))
		}
	}
	var port int
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", layaniWS)
	mux.HandleFunc("/m", sajikan("murid.html"))
	mux.HandleFunc("/api/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"kelasDuniaKotak": true, "alamat": alamatLokal(), "port": port, "guru": dariLaptopIni(r)})
	})
	entries, _ := fs.ReadDir(sub, ".")
	for _, e := range entries {
		n := e.Name()
		if strings.HasSuffix(n, ".html") && n != "murid.html" && n != "menu.html" {
			id := strings.TrimSuffix(n, ".html")
			mux.HandleFunc("/"+id+"/", sajikan(n))
		}
	}
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		if !dariLaptopIni(r) { // HP murid yang membuka alamat utama langsung diarahkan ke halaman murid
			http.Redirect(w, r, "/m", http.StatusFound)
			return
		}
		sajikan("menu.html")(w, r)
	})

	var ln net.Listener
	var err error
	for port = 8080; port <= 8099; port++ {
		ln, err = net.Listen("tcp", fmt.Sprintf(":%d", port))
		if err == nil {
			break
		}
	}
	if err != nil {
		fmt.Println("Tidak ada port yang bisa dipakai (8080-8099). Tutup aplikasi lain lalu coba lagi.")
		time.Sleep(30 * time.Second)
		os.Exit(1)
	}
	alamat := alamatLokal()
	garis := strings.Repeat("=", 58)
	fmt.Println(garis)
	fmt.Println("  KELAS DUNIA KOTAK · paket game SMP")
	fmt.Println("  Supported by www.willoapparel.com")
	fmt.Println(garis)
	fmt.Printf("  Layar guru (laptop ini) : http://localhost:%d\n", port)
	fmt.Printf("  Alamat untuk HP murid   : http://%s:%d/m\n", alamat[0], port)
	if len(alamat) > 1 {
		fmt.Printf("  Jaringan lain           : %s\n", strings.Join(alamat[1:], ", "))
	}
	fmt.Println()
	fmt.Println("  Biarkan jendela ini tetap terbuka selama kelas berlangsung.")
	fmt.Println("  Tutup jendela ini untuk menghentikan permainan.")
	fmt.Println(garis)
	if os.Getenv("KDK_TANPA_BROWSER") == "" {
		go func() { time.Sleep(600 * time.Millisecond); bukaBrowser(fmt.Sprintf("http://localhost:%d/", port)) }()
	}
	srv := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(srv.Serve(ln))
}
