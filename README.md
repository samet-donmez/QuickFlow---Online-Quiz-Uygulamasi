# QuizFlow — Online Quiz Uygulaması

## 1. Giriş

Günümüzde eğitim teknolojileri, öğrenme süreçlerini daha etkin ve ölçülebilir hale getirmek amacıyla sürekli gelişmektedir. Bu bağlamda, interaktif quiz uygulamaları, hem öğretmenlere hem de öğrencilere anlık değerlendirme ve geri bildirim imkanı sunarak eğitim kalitesini artırmaktadır. Bu proje kapsamında, web tabanlı bir quiz uygulaması geliştirilmiş; kullanıcıların kayıt olabileceği, giriş yapabileceği, quiz oluşturabileceği ve çözebileceği bir platform tasarlanmıştır.

---

## 2. Proje Amacı ve Hedefleri

Projenin temel amacı, öğretmenlerin kolayca quiz hazırlayıp paylaşabileceği, öğrencilerin ise bu quizleri çözerek bilgi seviyelerini ölçebileceği kullanıcı dostu bir web uygulaması geliştirmektir. Projenin başlıca hedefleri şunlardır:

- Rol bazlı erişim ile kullanıcıların farklı yetkilere sahip olması (öğrenci, eğitmen)
- Dinamik olarak quiz ve çoktan seçmeli soruların oluşturulabilmesi
- Gerçek zamanlı quiz oturumu yönetimi
- Modern ve responsive kullanıcı arayüzü ile kolay kullanım

---

## 3. Kullanılan Teknolojiler ve Araçlar

- **Node.js** ve **Express.js**: Sunucu tarafında uygulama mantığının geliştirilmesi için tercih edilmiştir.  
- **Handlebars (hbs)**: HTML şablonlama motoru olarak kullanılmıştır. Dinamik içerik yönetimi ve şablonların yönetimi için uygundur.  
- **Bootstrap 5**: Responsive ve estetik kullanıcı arayüzü için CSS framework olarak seçilmiştir.  
- **Socket.io**: Quizlerin gerçek zamanlı olarak yönetilmesi ve kullanıcılar arasında anlık veri transferi sağlamak amacıyla kullanılmıştır.  
- **MySQL**: Veritabanı yönetimi için seçilmiştir. Kullanıcı bilgileri, quizler ve sorular burada saklanmaktadır.  
- **Bcrypt**: Kullanıcı şifrelerinin güvenliğini sağlamak amacıyla şifreleme için tercih edilmiştir.  

---

## 4. Proje Mimarisi ve Tasarımı

Uygulama MVC (Model-View-Controller) mimarisine benzer bir yapı ile geliştirilmiştir.

- **Model**: Veritabanı bağlantıları ve sorguları içerir. Kullanıcılar, quizler ve sorular veritabanında tutulmaktadır.  
- **View**: Handlebars şablonlarıyla dinamik HTML sayfaları oluşturulmuştur. Örnek olarak `login.hbs`, `register.hbs`, `quiz.hbs`, `quizolustur.hbs` gibi dosyalar sayfa tasarımlarını içerir.  
- **Controller**: Express route’ları ve socket.io olayları ile uygulamanın iş mantığı yönetilir. Kullanıcı kayıt, giriş, quiz oluşturma, listeleme ve çözme işlemleri burada gerçekleşir.

### Kullanıcı Rolleri:
- **Eğitmen**: Quiz oluşturma, quizleri yönetme ve quiz çözme  
- **Öğrenci**: Quiz çözme ve sonuçları görme  

---

## 5. Uygulamanın Temel Özellikleri

### 5.1 Kayıt ve Giriş İşlemleri  
Kullanıcılar `register.hbs` sayfasından rol seçerek kayıt olabilirler. Kayıt sırasında şifreler **bcrypt** kullanılarak hashlenir. `login.hbs` sayfasından giriş yapılır, giriş bilgileri doğrulanır ve kullanıcı oturumu başlatılır.

### 5.2 Quiz Oluşturma  
Eğitmenler, `quizolustur.hbs` sayfasında dinamik olarak sorular ekleyip, çoktan seçmeli şıklar ve doğru cevabı belirleyerek quiz oluşturabilirler. Form, JavaScript ile dinamik olarak yeni sorular eklenmesine olanak sağlar.

### 5.3 Quiz Listesi ve Çözümü  
`quiz.hbs` sayfasında kullanıcı rolü doğrulanarak quiz listesi gösterilir. Öğrenciler listeden quiz seçerek detay sayfasından soruları cevaplayabilir. Quiz detayları `quiz_details.hbs` şablonunda sunulur.

### 5.4 Gerçek Zamanlı Quiz Yönetimi  
**Socket.io** entegrasyonu ile quiz oturumları gerçek zamanlı yönetilir. Bu sayede quiz sırasında sorular anlık olarak öğrencilere iletilir, cevaplar toplanır ve sonuçlar anında hesaplanabilir.

---

## 6. Karşılaşılan Zorluklar ve Çözümler

- **Dinamik Form Elemanları**: Quiz sorularının dinamik olarak eklenmesi ve form verilerinin uygun formatta gönderilmesi zorlu oldu. JavaScript ile isimlendirmede dikkat edilerek çözüm sağlandı.  
- **Rol Bazlı Erişim**: Handlebars'da kullanıcı rolüne göre şablonların koşullu render edilmesi başlarda sorun yarattı. Bu amaçla helper fonksiyonları yazıldı.  
- **Gerçek Zamanlı İletişim**: Socket.io'nun doğru ve tutarlı şekilde oturum yönetimini sağlaması için çoklu bağlantı senaryoları test edilerek optimize edildi.  
- **Veritabanı Yönetimi**: Çoklu tablo ilişkileri ve sorgu optimizasyonu için MySQL sorguları dikkatle tasarlandı.  

---

## 7. Sonuç ve Değerlendirme

Proje başarılı bir şekilde tamamlanmış ve temel hedefler gerçekleştirilmiştir. İnteraktif quiz uygulaması, eğitim süreçlerinde aktif kullanım için uygun bir platform sunmaktadır. Kullanıcı dostu arayüzü ve rol bazlı yetkilendirmesi ile kolay adapte olunabilir.  

Gelecekte kullanıcı deneyimini artırmak amacıyla;
- Mobil uyumluluk
- Detaylı raporlama
- Farklı soru tipleri eklenmesi planlanmaktadır.

---

## 8. Kaynaklar

- [Node.js Resmi Dokümantasyonu](https://nodejs.org)  
- [Express.js Resmi Sitesi](https://expressjs.com)  
- [Handlebars.js Belgeleri](https://handlebarsjs.com)  
- [Bootstrap 5 Kullanım Kılavuzu](https://getbootstrap.com/docs/5.3)  
- [Socket.io Resmi Sitesi](https://socket.io)  
- [MySQL Resmi Dokümantasyonu](https://dev.mysql.com/doc/)  

---

## 9. Demo Videosu  
📺 [Uygulamanın YouTube Videosu](https://www.youtube.com/watch?v=LmCzYkE0kdg)


## 9. Uygulamadan Ekran Görüntüleri
![Desktop 2025-06-14 21-52-09-531](https://github.com/user-attachments/assets/bd8cc80a-aa4b-4d2f-9b0b-bb9442bbbfd8)
![Desktop 2025-06-14 21-52-33-508](https://github.com/user-attachments/assets/f826d223-ce3e-4604-829a-f1fefde470a0)
![Desktop 2025-06-14 22-06-52-266](https://github.com/user-attachments/assets/5d6f3947-071c-43d4-a8f4-183ae5fede8f)
![Desktop 2025-06-14 21-53-28-469](https://github.com/user-attachments/assets/6601de32-a6fc-40a0-9afc-1d343d1822ee)
![Desktop 2025-06-14 21-54-40-588](https://github.com/user-attachments/assets/bdb5696b-0ee6-4984-877c-08933c821080)
![Desktop 2025-06-14 21-55-37-631](https://github.com/user-attachments/assets/ae88c4c0-723e-42df-8eb2-f2cf9555bc7a)
![Desktop 2025-06-14 22-07-19-368](https://github.com/user-attachments/assets/dc870809-5f74-4b3a-826d-615d4f0f89c6)
![Desktop 2025-06-14 22-07-40-540](https://github.com/user-attachments/assets/91df88e3-9220-40cb-a562-4f85958d9571)






