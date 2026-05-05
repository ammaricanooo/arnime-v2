# Cara Build APK Arnime untuk Android

## Yang Dibutuhkan

1. **Android Studio** — download gratis di https://developer.android.com/studio
2. **JDK 17** — biasanya sudah include di Android Studio
3. Koneksi internet untuk download dependencies

---

## Langkah 1 — Install Android Studio

1. Download Android Studio dari https://developer.android.com/studio
2. Install dan jalankan
3. Saat setup wizard, pilih **Standard** installation
4. Tunggu sampai semua SDK terdownload (~2-3 GB)

---

## Langkah 2 — Buka Project

1. Buka Android Studio
2. Klik **Open** (bukan New Project)
3. Pilih folder `android-app` ini
4. Tunggu Gradle sync selesai (~2-5 menit pertama kali)

---

## Langkah 3 — Tambahkan Icon App (Opsional)

Ganti icon default dengan icon Arnime:

1. Klik kanan folder `app/src/main/res`
2. Pilih **New → Image Asset**
3. Pilih file `arnime.svg` atau PNG sebagai source
4. Klik **Next → Finish**

---

## Langkah 4 — Build APK Debug (untuk test)

1. Di menu atas: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Tunggu proses build (~1-2 menit)
3. Klik notifikasi **"locate"** yang muncul di pojok kanan bawah
4. APK ada di: `app/build/outputs/apk/debug/app-debug.apk`

---

## Langkah 5 — Build APK Release (untuk distribusi)

### Buat Keystore (sekali saja)

1. Menu: **Build → Generate Signed Bundle / APK**
2. Pilih **APK** → Next
3. Klik **Create new...** untuk buat keystore baru
4. Isi form:
   - **Key store path**: simpan di tempat aman (misal `arnime-keystore.jks`)
   - **Password**: buat password yang kuat
   - **Alias**: `arnime`
   - **Validity**: 25 tahun
   - **First and Last Name**: nama kamu
5. Klik **OK**

### Build Release APK

1. Pilih keystore yang baru dibuat
2. Masukkan password
3. Pilih **release** build variant
4. Klik **Finish**
5. APK ada di: `app/build/outputs/apk/release/app-release.apk`

---

## Langkah 6 — Install ke HP

### Via USB (cara termudah)
1. Aktifkan **Developer Options** di HP:
   - Pengaturan → Tentang Ponsel → tap **Nomor Build** 7 kali
2. Aktifkan **USB Debugging**
3. Sambungkan HP ke PC via USB
4. Di Android Studio, klik tombol **Run ▶** (atau Shift+F10)
5. Pilih HP kamu dari daftar

### Via file APK
1. Copy file APK ke HP (via USB, Google Drive, dll)
2. Buka file manager di HP
3. Tap file APK
4. Izinkan install dari sumber tidak dikenal jika diminta
5. Tap **Install**

---

## Struktur Project

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/id/arnime/app/
│   │   │   └── MainActivity.kt      ← Kode utama WebView
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   └── activity_main.xml ← Layout UI
│   │   │   └── values/
│   │   │       ├── strings.xml       ← Nama app
│   │   │       ├── colors.xml        ← Warna
│   │   │       └── themes.xml        ← Theme
│   │   └── AndroidManifest.xml       ← Konfigurasi app
│   └── build.gradle                  ← Dependencies
└── build.gradle
```

---

## Kustomisasi

### Ganti URL website
Edit `MainActivity.kt` baris:
```kotlin
const val APP_URL = "https://arnime.ammaricano.my.id"
```

### Ganti nama app
Edit `res/values/strings.xml`:
```xml
<string name="app_name">Arnime</string>
```

### Ganti warna progress bar
Edit `res/values/colors.xml`:
```xml
<color name="indigo">#4F46E5</color>
```

### Izinkan landscape mode
Edit `AndroidManifest.xml`, hapus baris:
```xml
android:screenOrientation="portrait"
```

---

## Troubleshooting

**Gradle sync gagal**
→ Pastikan koneksi internet aktif, klik **File → Sync Project with Gradle Files**

**"SDK not found"**
→ Buka **File → Project Structure → SDK Location**, set path Android SDK

**APK tidak bisa diinstall**
→ Aktifkan "Install dari sumber tidak dikenal" di Pengaturan HP

**Layar putih saat buka app**
→ Pastikan HP terhubung internet, website arnime.ammaricano.my.id bisa diakses

---

## Catatan Penting

- APK ini adalah **WebView wrapper** — artinya app hanya membuka website Arnime
- Semua update konten otomatis tanpa perlu update APK
- Ukuran APK sangat kecil (~3-5 MB) karena tidak ada konten offline
- Untuk publish ke Google Play Store, perlu akun developer ($25 sekali bayar)
