# Kart Savaşı Oyunu

Bu proje, sıra tabanlı bir kart savaş oyunudur. Oyuncular, 11 farklı kart arasından 4 tanesini seçerek savaşır.

## Oyun Özellikleri

- 11 farklı kart, her biri eşsiz yeteneklere sahip
- Kart seçim ekranı
- Hıza göre sıralanan saldırı düzeni
- Tur sistemi
- Savaş kayıtları
- Çeşitli kart özellikleri ve efektleri

## Nasıl Oynanır

1. Oyunu açtığınızda, 11 karttan 4 tanesini seçmeniz istenecektir.
2. Kartları seçtikten sonra "Oyunu Başlat" butonuna tıklayın.
3. Oyun, hız değerine göre kartların saldırı sırasını belirler.
4. Her kart sırayla otomatik olarak rakip kartlara saldırır.
5. Tüm kartlar saldırdığında bir tur tamamlanır.
6. Bir oyuncunun tüm kartları öldüğünde oyun sona erer.

## Kart Özellikleri

Her kartın kendine özgü özellikleri vardır:

- **Ateş Savaşçısı**: Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır.
- **Buz Büyücüsü**: Rakibini dondurarak hızını 2 azaltır.
- **Taş Kalkan**: Gelen hasarın %20'sini engeller.
- **Çevik Hançer**: Peş peşe 3 kez hasar verir.
- **Hayalet**: İlk iki saldırıda %60 kaçınma şansına sahiptir.
- **Kara Şövalye**: Her tur başında saldırı gücü 5 artar.
- **Şifacı**: Her turda tüm dost kartlara +7 can verir. Maksimum canı aşabilir.
- **Zehirli Ok**: Zehirlediği rakip ölene kadar her tur 8 hasar alır ve zırhı -1 azalır.
- **Savaş Borazanı**: Yaşadığı sürece dost kartların saldırı gücü +4 artar.
- **Kan Emici**: İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir.
- **İkiz Okçu**: Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir.

## Geliştirme Planı

### Halihazırda Olan Özellikler
- ✅ Temel oyun mekanikleri
- ✅ Kart seçim sistemi
- ✅ Tur tabanlı savaş sistemi
- ✅ Kart özellikleri ve efektleri

### Eklenecek Özellikler
- ❌ Farklı haritalar ve harita efektleri
- ❌ Ses efektleri ve müzik

## Teknolojiler

- HTML
- CSS
- JavaScript (Saf JavaScript, herhangi bir framework kullanılmamıştır)

## Nasıl Başlatılır

1. Dosyaları indirin
2. İndirilen klasördeki `index.html` dosyasını bir web tarayıcısında açın

## Tarayıcı Uyumluluğu

Oyun şu tarayıcılarda test edilmiştir:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

## Lisans

Bu proje açık kaynaklıdır ve eğitim amaçlı olarak geliştirilmiştir. 
