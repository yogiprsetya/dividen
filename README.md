# Dividend Capture Radar

Screener dividen saham IDX yang membaca CSV kalender dividen Stockbit, memperkirakan Cum Date berikutnya dari pola tahun-tahun sebelumnya, lalu menandai saham yang sedang berada 60 sampai 90 hari sebelum perkiraan Cum Date. Di rentang itu kamu bisa mulai mengumpulkan saham sebelum harga biasanya naik menjelang pembagian dividen.

Semua data diproses di browser. File CSV yang kamu unggah tidak dikirim ke server mana pun.

## Tutorial penggunaan

### 1. Muat data

Halaman pertama hanya berisi area unggah. Ada dua pilihan:

- **Unggah CSV Stockbit.** Seret file `.csv` ke kotak "Drag & drop your Stockbit CSV here", atau klik kotak itu untuk memilih file.
- **Coba dengan data contoh.** Klik **Load Demo Data**. Aplikasi memuat data dividen ASII, BBCA, BBRI, ITMG, PTBA, dan UNTR tahun 2022 sampai 2024, jadi kamu bisa mencoba semua fitur tanpa menyiapkan file.

Setelah data termuat, bagian bawah halaman menampilkan jumlah baris yang terbaca dan yang dilewati. Kalau ada baris yang bermasalah, daftar **Parse Warnings** menyebut nomor baris dan alasannya, misalnya Cum Date tidak valid atau nilai dividen nol. Baris lain tetap diproses.

Untuk mengganti data, klik **Clear Data** lalu unggah file baru.

### 2. Baca ringkasan

Empat kartu di atas meringkas saham yang lolos filter saat ini:

| Kartu                   | Isi                                          |
| ----------------------- | -------------------------------------------- |
| Active Buy Windows      | Jumlah saham berstatus In Window             |
| Approaching Windows     | Jumlah saham berstatus Approaching           |
| Average Estimated Yield | Rata-rata perkiraan yield                    |
| Next Upcoming Cum Date  | Perkiraan Cum Date terdekat yang belum lewat |

Angka-angka ini ikut berubah saat kamu mengubah filter.

### 3. Pahami status buy window

Setiap saham diberi satu status berdasarkan jumlah hari dari hari ini ke perkiraan Cum Date berikutnya:

| Status      | Hari ke Cum Date | Artinya                                                       |
| ----------- | ---------------- | ------------------------------------------------------------- |
| In Window   | 60 sampai 90     | Rentang akumulasi yang dicari aplikasi ini                    |
| Approaching | 91 sampai 120    | Masuk daftar pantau, buy window dimulai dalam beberapa minggu |
| Late        | kurang dari 60   | Terlalu dekat dengan Cum Date atau sudah lewat                |
| Off Cycle   | lebih dari 120   | Masih jauh                                                    |

### 4. Saring daftar saham

Panel filter punya empat kontrol:

- **Search** mencari berdasarkan kode saham atau nama perusahaan, misalnya `bbca` atau `astra`.
- **Minimum Yield** menyembunyikan saham dengan perkiraan yield di bawah angka yang dipilih (0% sampai 25%, langkah 0,5%).
- **Accumulation Month** menampilkan saham yang Cum Date-nya biasanya jatuh di bulan tersebut. Untuk saham yang membagi dividen dua kali setahun, yang dipakai adalah bulan yang lebih awal dalam kalender.
- **Window Status** memilih antara semua saham, hanya In Window, atau hanya Approaching.

Klik **Reset Filters** untuk mengembalikan semua filter ke awal. Teks "Showing X of Y stocks" di atas tabel menunjukkan berapa saham yang lolos filter.

### 5. Baca tabel radar

Di layar lebar, setiap baris tabel berisi:

- **Symbol**: kode dan nama perusahaan
- **Status**: status buy window
- **Price**: harga terakhir yang tercatat di CSV
- **Est. Cum Date**: perkiraan Cum Date berikutnya
- **Days to Cum Date**: sisa hari menuju perkiraan Cum Date
- **Est. DPS** dan **Est. Yield**: diambil dari dividen terakhir yang tercatat
- **Consistency**: skor 0 sampai 100. Makin banyak tahun data dan makin teratur jadwalnya, makin tinggi skornya. Saham dengan jadwal tidak teratur dibatasi maksimal 50.
- **Historical Payouts**: klik tombol "N payouts" untuk membuka riwayat dividen saham itu

Klik judul kolom **Symbol**, **Days to Cum Date**, atau **Est. Yield** untuk mengurutkan. Klik lagi untuk membalik urutan. Di layar ponsel, tabel tampil sebagai kartu per saham dengan data yang sama.

### 6. Lihat pola musiman

Bagian **Dividend seasonality** menampilkan 12 bulan dalam setahun. Setiap bulan punya dua batang:

- batang pertama menghitung berapa saham yang buy window-nya jatuh di bulan itu
- batang kedua menghitung berapa saham yang perkiraan Cum Date-nya jatuh di bulan itu

Bulan berjalan diberi garis bawah. Grafik ini juga mengikuti filter yang aktif.

### 7. Ekspor watchlist

Dua tombol di atas tabel bekerja pada daftar yang sudah difilter:

- **Download CSV** mengunduh `dividen-watchlist.csv` berisi ticker, nama, harga, perkiraan Cum Date, yield, sisa hari, status, dan skor konsistensi.
- **Copy Tickers** menyalin kode saham dalam format `ASII,BBCA,PTBA` supaya bisa langsung ditempel ke watchlist broker.

Contoh alur: geser Minimum Yield ke 5%, pilih Window Status **In Window**, lalu klik **Copy Tickers**.

## Format CSV yang diterima

Baris pertama harus berisi header. Pemisah kolom boleh koma atau titik koma. Nama header tidak peka huruf besar, spasi, atau tanda baca, dan bisa memakai istilah Inggris maupun Indonesia.

| Kolom             | Wajib | Contoh header yang dikenali                         |
| ----------------- | ----- | --------------------------------------------------- |
| Kode saham        | Ya    | `Symbol`, `Ticker`, `Kode`, `Emiten`                |
| Cum Date          | Ya    | `Cum Date`, `Tanggal Cum`                           |
| Dividen per saham | Ya    | `Dividend (Rp)`, `Cash Dividend`, `Dividen`, `DPS`  |
| Ex Date           | Ya    | `Ex Date`, `Tanggal Ex`                             |
| Payment Date      | Tidak | `Payment Date`, `Tanggal Pembayaran`                |
| Yield             | Tidak | `Yield (%)`, `Dividend Yield`, `DY`                 |
| Harga             | Tidak | `Price`, `Harga`, `Close Price`                     |
| Tipe dividen      | Tidak | `Type`, `Tipe Dividen` (isi `Interim` atau `Final`) |

Tanggal boleh ditulis `DD/MM/YYYY`, `YYYY-MM-DD`, atau `DD-MMM-YYYY` dengan nama bulan Inggris maupun Indonesia (`10-Mei-2024`). Kalau yield kosong tapi harga ada, yield dihitung dari dividen dibagi harga, begitu pula sebaliknya.

Perkiraan makin akurat kalau CSV memuat beberapa tahun riwayat untuk setiap saham.

## Batasan

Tanggal dan yield di aplikasi ini adalah perkiraan dari pola dividen sebelumnya, bukan saran investasi. Dividen tahun lalu tidak menjamin dividen tahun ini. Cek pengumuman resmi di IDX sebelum bertransaksi.
