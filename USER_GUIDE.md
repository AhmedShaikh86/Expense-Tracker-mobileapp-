# Expense Tracker: User Guide (Istemal ka Tareeqa)

**Developed by Muhammad Ahmed Shaikh**

Yeh guide batati hai ke app ko kaise istemal karna hai. App ke buttons English mein hain, is liye unke naam
yahan **bold** mein likhe hain.

---

## 1. App ke 5 hisse (neeche wale tabs)

| Tab | Kya hai |
| --- | --- |
| **Home** | Is mahine ka total kharcha, budget, alerts aur recent expenses |
| **Expenses** | Tamam kharchon ki list: search, filter, edit, delete |
| **Stats** | Charts: kis category mein kitna kharch hua, aur pichle 6 mahine |
| **Budgets** | Har category ka mahana budget aur kitna bacha hai |
| **Settings** | Currency, dark mode, categories, recurring, export, data clear |

---

## 2. Naya kharcha (expense) add karna

1. **Home** par **Add expense** dabayein, ya kisi bhi screen par neeche kone mein neela **+** button dabayein.
2. **Amount** likhein, maslan `1250` ya `1250.50`.
3. **Category** chunein, maslan Food, Transport ya Bills.
4. **Date** par tap kar ke tareekh chunein. Pehle se aaj ki tareekh lagi hoti hai.
5. **Note** (optional) mein chhoti si detail likh sakte hain, maslan "Biryani with friends".
6. **Add expense** dabayein. ✅

Agar amount khaali ho ya ghalat ho, to laal rang mein error aa jayega.

---

## 3. Kharcha edit ya delete karna

- **Edit:** kisi bhi expense par **tap** karein, tabdeeli karein aur **Save changes** dabayein.
- **Delete (tareeqa 1):** Expenses list mein expense ke saath laal 🗑️ icon par tap karein, phir **Delete** dabayein.
- **Delete (tareeqa 2):** expense par **dabaye rakhein (long press)**, phir **Delete** dabayein.
- **Delete (tareeqa 3):** expense khol kar neeche **Delete expense** dabayein.

⚠️ Delete kiya hua kharcha wapas nahi aata.

---

## 4. Kharche dhoondna (Search aur Filter)

**Expenses** tab mein:

- **Search:** upar search box mein note ya category ka naam likhein, maslan "biryani" ya "food".
- **Filter:** search ke saath wala ⚙️ button dabayein. Yahan aap:
  - ek ya zyada **categories** chun sakte hain,
  - **tareekh ki range** de sakte hain (From / To),
  - **amount ki range** de sakte hain (Min / Max).
  - Phir **Apply** dabayein. Filter hatane ke liye **Reset** dabayein.
- List har din ke hisaab se grouped hoti hai, aur har din ka total bhi likha hota hai.

---

## 5. Stats (Charts)

- Upar **‹ ›** teer se mahina badlein.
- **By category:** gol chart dikhata hai ke kis category mein kitna % kharch hua.
- **Last 6 months:** bar chart mein pichle 6 mahine ka kharcha nazar aata hai.

---

## 6. Budget set karna

1. **Budgets** tab kholein.
2. Kisi category par tap karein, maslan Food → **Set budget**.
3. Mahana hadd likhein, maslan `15000`, aur **Save** dabayein.

Budget ka rang batata hai ke aap kahan hain:

| Rang | Matlab |
| --- | --- |
| 🟢 Hara | Theek hai |
| 🟠 Narangi | 80% budget istemal ho chuka hai (warning) |
| 🔴 Laal | Budget se zyada kharcha ho gaya (alert) |

Jab koi kharcha add karte hue budget 80% ya 100% cross karta hai, to app foran popup se bata deti hai.
Budget hatane ke liye category par tap karein aur **Remove budget** dabayein.

---

## 7. Categories banana ya badalna

**Settings → Categories**:

- **Nayi category:** **+** dabayein, naam likhein, **icon** aur **rang** chunein, aur chahein to budget bhi dein.
  Phir **Create category** dabayein.
- **Edit:** kisi category par tap karein.
- **Delete:** apni banai hui category ke saath 🗑️ dabayein. Us category ke kharche khud-ba-khud **"Other"**
  mein chale jaate hain. Pehle se bani (default) 8 categories delete nahi hoti, sirf edit hoti hain.

---

## 8. Har mahine wale kharche (Recurring: Rent, Bills)

Jo kharcha har mahine hota hai (kiraya, bijli ka bill, internet), usay baar baar likhne ki zaroorat nahi:

1. Kharcha add karte waqt **Repeat monthly** on karein.
2. **Day of month** likhein, yani mahine ki kis tareekh ko yeh kharcha hota hai, maslan `1`.
3. **Add expense** dabayein.

Ab har mahine us tareekh ke baad **jab aap app kholenge**, yeh kharcha khud add ho jayega.
Agar tareekh 31 hai aur mahina chhota hai, to mahine ki aakhri tareekh use hogi.

- Tamam recurring kharche dekhne ke liye: **Settings → Recurring expenses**.
- Band karne ke liye: **Stop repeating** dabayein. Pehle se add hue kharche delete nahi hote.

---

## 9. Export (Excel / CSV file)

- **Settings → Export to CSV** dabayein.
- Share menu khulega. Wahan se file **WhatsApp, Gmail, Google Drive** waghera par bhej ya save kar sakte hain.
- Yeh file **Excel ya Google Sheets** mein khulti hai.
- **Expenses** tab mein upar ka share icon sirf **filter ki hui list** export karta hai.

---

## 10. Settings

- **Appearance:** **System / Light / Dark**. Dark mode raat ko aankhon ke liye behtar hai.
- **Currency:** Rs (PKR) ke ilawa $, €, £, ₹ waghera. Sirf nishan (symbol) badalta hai; amounts convert nahi hote.
- **Clear all data:** ⚠️ tamam kharche, categories aur budgets **hamesha ke liye** mita deta hai. Pehle export kar lein.
- **About:** app ka version aur developer ka naam.

---

## 11. ⚠️ Aap ke data ke baare mein zaroori baatein

- Aap ka tamam data **sirf aap ke phone mein** save hota hai. Internet ki zaroorat nahi.
- **App uninstall karne se sara data mit jata hai.**
- Is liye **har mahine ek dafa Export to CSV** kar ke file Google Drive ya WhatsApp par save kar lein. Yeh aap ka backup hai.
- App ka **naya version (nayi APK) install karne se data nahi mit'ta**, bas purani app ko uninstall na karein.

---

## 12. App ka naya version kaise aata hai (Updates)

Developer jab app mein tabdeeli kar ke update bhejta hai, to:

1. App **kholein**, internet on ho.
2. App khud naya version download karti hai aur **ek second ke liye restart** hoti hai.
3. **Settings → About** mein "Updated ..." ke saath tareekh nazar aayegi.

Agar internet nahi hai to app purane version par normal chalti rahegi, aur update agli dafa aa jayega.
Aap ka data update se **nahi mit'ta**.

---

## 13. Aam sawal (FAQ)

**Recurring kharcha add nahi hua?**
Recurring kharche tab add hote hain jab aap app **kholte** hain aur woh tareekh aa chuki ho. App ko ek dafa band kar ke dobara kholein.

**Ghalat amount daal diya?**
Expense par tap karein, amount theek karein aur **Save changes** dabayein.

**Chart khaali hai?**
Us mahine mein koi kharcha nahi hai. Upar **‹** se pichla mahina dekhein.

**Dark mode apne aap badal raha hai?**
**System** chuna hua hai, jo phone ki setting follow karta hai. **Light** ya **Dark** chun lein.
