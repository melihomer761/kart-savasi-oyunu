# Güncelleme Notları




PROJE DURUM BİLDİRİMİ: EVENT-DRIVEN MİMARİ
Mevcut Durum:
Proje, spagetti koddan (if/else blokları) kurtarılıp Event-Driven (Olay Güdümlü) ve Dependency Injection mimarisine geçiş aşamasındadır.

Tamamlanan/Onaylanan Mimari:

Data-Driven: cards.js içindeki kart verileri, doğrudan yetenek kodlarını değil, yetenek tanımlayıcılarını (örn: effect: "fireExplosion") tutacak şekilde düzenleniyor.

Logic-Driven: gameLogic.js içerisinde bir cardEffects objesi oluşturuldu. Kart yetenekleri bu obje içinde merkezi bir yerde toplanıyor.

Bağımlılık (Injection): window (global) nesnesi kullanımı YASAKTIR. Kartlar, cardEffects fonksiyonlarına Dependency Injection yöntemiyle erişecek.

UI Ayrımı: Tüm DOM manipülasyonları (querySelector, classList, vb.) ui.js modülüne taşınacaktır.

Sıradaki Kritik Adım:

cards.js üzerindeki if/else ile yazılmış eski yetenek bloklarının temizlenmesi ve yerine cardEffects yapısının entegrasyonu.

SON DURUM (20.06.2026 - 19:47):

✅ Tamamlananlar:
- Dependency Injection mimarisi uygulandı
- Card constructor'a cardEffects parametresi eklendi
- GameState constructor'a cardEffects parametresi eklendi
- window.cardEffects kullanımı kaldırıldı
- Tüm DOM manipülasyonları ui.js'e taşındı (gameLogic.js ve gameState.js'den)
- UI metodları eklendi: setDead, setPoisoned, setHealed, setReflectDamage, setDamageReduced, setTargetable, setActiveCard, setAttackBuff, setSelected, isSelected, toggleSelected
- Debug logları eklendi (cardEffects tanımlı mı kontrolü)

⚠️ Mevcut Sorun:
- Kart özellikleri (2x saldırı, yavaşlatma vb.) henüz çalışmıyor
- Debug aşamasında - console logları ile cardEffects'in doğru geçilip geçilmediği kontrol ediliyor

🔧 Sıradaki Adım:
- Console çıktılarını kontrol ederek cardEffects'in doğru geçildiğini doğrula
- Eğer cardEffects undefined ise, constructor'a geçiş sorununu çöz
- Eğer cardEffects tanımlı ama yetenekler çalışmıyorsa, event hook'ları kontrol et

Test ortamı: http://localhost:8000 (Python server üzerinden çalışıyor).

Yasaklar (Windsurf İçin Hatırlatma):

Kesinlikle if (kart.isim === "...") gibi hard-coded kontroller yazma.

document.querySelector gibi DOM işlemlerini gameLogic.js veya cards.js içerisinde kullanma.

Global window değişkeni ile kod yazma

🛠️ PROJE ÇALIŞTIRMA VE HATA GİDERME NOTU
Hata Analizi:
Tarayıcıda karşılaşılan Unsafe attempt to load URL hatasının sebebi, oyunun file:// protokolü (dosya sisteminden doğrudan açılması) ile çalıştırılmasıdır. Tarayıcı, güvenlik gereği bu şekilde açılan dosyalarda scriptlerin birbirine erişimini (Dependency Injection ve modül iletişimi) engellemektedir.

Çözüm (Web Sunucusu ile Çalıştırma):
Oyunun doğru çalışması için "Localhost" (Yerel Sunucu) üzerinden servis edilmesi şarttır.

Adımlar:

VS Code'u Aç: Proje klasörünü VS Code ile aç.

Live Server Kullan:

VS Code içerisinde "Extensions" (sol menüdeki kare simge) kısmına git.

"Live Server" (Ritwick Dey) eklentisini kur.

Klasördeki index.html dosyasına sağ tıkla ve "Open with Live Server" seçeneğine bas.

Alternatif (Terminal):

VS Code terminalini aç (Ctrl + J).

python -m http.server 8000 komutunu gir.

Tarayıcı adres çubuğuna http://localhost:8000 yaz.

Neden Gerekli?

file:// (direkt açılan dosya) = Güvenlik engelli, kısıtlı JS.

http://localhost:8000 (Sunucu) = Tam yetkili, modüler ve sorunsuz JS.

- Oyun başlatma ve kart efektleri kodu sadeleştirildi. Artık applyCardEffects sadece startGame fonksiyonunda bir kez çağrılıyor, böylece oyun başında tekrarlı loglar ve efektler engellendi.
- Loglarda gereksiz ve tekrar eden ifadeler temizlendi. Yanma, buff yok sayma, bazı kartların oyun başı logları kaldırıldı.
- Kan Emici'nin can emme ve zırh mekanikleri düzeltildi. Artık her iki saldırıda da zırh uygulanıyor ve can emme gerçek hasarın %60'ı kadar oluyor.
- İkili Siper'in zırh bonusu birikmeli ve tur sonunda sıfırlanacak şekilde güncellendi. Artık aynı turda birden fazla saldırıda bonuslar birikiyor.
- Büyü Tazısı'nın debuff yok sayma logu sadeleştirildi.

**Sürüm: 0.0.1.1** 
**Tarih: 19.06.2025**
- **Büyü Tazısı**: Canı 120 → 112 (**% -6,7 nerf**)
- **Büyü Tazısı**: Saldırı gücü 15 → 23 (**% +53,3 buff**)
- **Büyü Tazısı**: Hızı 6 → 4 (**% -33,3 nerf**)
- **Büyü Tazısı**: Zırhı 12 → 7 olarak güncellendi (**% -41,6 nerf**)
- **Büyü Tazısı**: Artık Büyü Tazısı'na saldıran kartın tüm buff/debuff anında sıfırlanır. (Saldırı, hız, zırh, efektler ilk haline döner.)

---

**Sürüm: 0.0.1**  
**Tarih: 2024-06-16**
- **Ateş Savaşçısı**: Ana saldırı gücü 17 → 14 (%-17,6)
- **Ateş Savaşçısı**: Yan kartlara verdiği splash hasarı sabit 11 → ana saldırı gücü kadar (14)
- **Taş Kalkan**: Zırhı 6 → 0 (**%-100**), hasar azaltma %10 → %20 (**%+100**). Artık zırhı yok, gelen hasarın %20'sini engelliyor.,
> Kart dengesi için yapılan değişiklikler yukarıda listelenmiştir. 

## Yeni Kartlar ve Özellik Güncellemeleri

- 3 yeni kart eklendi: **Kalkan Kopyalayıcı**, **İntikamcı**, **Dikenli Deri**
    - **Kalkan Kopyalayıcı**: Saldırıya uğradığında rakibin zırhını +2 ile kopyalar.
    - **Dikenli Deri**: Saldırana alınan hasarın %25'ini yansıtır.
- Kart açıklamaları kısaltıldı ve sadeleştirildi.
- **Büyü Tazısı**: Özelliği değiştirildi, yeni özelliği üzerinde çalışılıyor.