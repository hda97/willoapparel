"""Bank soal Bahasa Inggris SMP (Kurikulum Merdeka) untuk English Quest.

Tiap soal: (topik, soal, jawaban benar, [3 pengecoh], penjelasan singkat dalam Bahasa Indonesia).
"""
import random

S = {
    '7': [
        # Greetings and Introduction
        ('Greetings', 'Rina: "Good morning, Sir." Teacher: "…"', 'Good morning, Rina.', ['Good night, Rina.', 'Goodbye, Rina.', 'See you, Rina.'], 'Salam pagi dibalas dengan "Good morning".'),
        ('Greetings', '"Nice to meet you." The best reply is …', 'Nice to meet you too.', ['I am fine, thank you.', 'You are welcome.', 'See you later.'], '"Nice to meet you" dibalas "Nice to meet you too".'),
        ('Greetings', '"How are you?" The best reply is …', "I'm fine, thank you.", ['My name is Dito.', "I'm from Bandung.", "I'm thirteen."], '"How are you?" menanyakan kabar.'),
        ('Greetings', 'Which one is used to say goodbye at night?', 'Good night.', ['Good evening.', 'Good afternoon.', 'Good morning.'], '"Good night" dipakai saat berpisah atau mau tidur malam hari.'),
        ('Greetings', '"Let me introduce myself. … name is Sari."', 'My', ['I', 'Me', 'Mine'], 'Kata ganti kepemilikan sebelum kata benda: my name.'),
        ('Greetings', '"Where are you from?" "I … from Medan."', 'am', ['is', 'are', 'be'], 'Subjek I memakai to be "am".'),
        # Things Around Us
        ('Things Around Us', 'We use it to cut paper. It is a pair of …', 'scissors', ['rulers', 'erasers', 'staplers'], 'Scissors = gunting.'),
        ('Things Around Us', '"There … three books on the table."', 'are', ['is', 'am', 'be'], 'Benda jamak (three books) memakai "are".'),
        ('Things Around Us', 'The cat is … the table. (kucing di bawah meja)', 'under', ['on', 'above', 'behind'], 'Under = di bawah.'),
        ('Things Around Us', 'The plural form of "box" is …', 'boxes', ['boxs', 'boxies', 'box'], 'Kata berakhiran -x ditambah -es.'),
        ('Things Around Us', 'Which one is a fruit?', 'mango', ['carrot', 'spinach', 'cabbage'], 'Mango (mangga) adalah buah. Lainnya sayuran.'),
        ('Things Around Us', '"This is … umbrella."', 'an', ['a', 'the', 'two'], 'Kata yang diawali bunyi vokal memakai "an".'),
        # Simple Present
        ('Simple Present', 'My father … coffee every morning.', 'drinks', ['drink', 'drank', 'drinking'], 'Subjek orang ketiga tunggal (my father) + verb-s.'),
        ('Simple Present', 'They … football every Sunday.', 'play', ['plays', 'played', 'playing'], 'Subjek jamak (they) memakai verb dasar.'),
        ('Simple Present', 'Siti … not like spicy food.', 'does', ['do', 'is', 'are'], 'Kalimat negatif subjek tunggal ketiga: does not.'),
        ('Simple Present', '"… you go to school by bus?" "Yes, I do."', 'Do', ['Does', 'Are', 'Is'], 'Pertanyaan dengan subjek "you" memakai "Do".'),
        ('Simple Present', 'The sun … in the east.', 'rises', ['rise', 'rose', 'rising'], 'Fakta umum memakai simple present. The sun = tunggal, jadi rises.'),
        # Time and Days
        ('Time and Days', 'It is 07.30. In English we say …', 'half past seven', ['half past six', 'seven fifteen', 'a quarter to seven'], '07.30 = half past seven.'),
        ('Time and Days', 'It is 08.45. In English we say …', 'a quarter to nine', ['a quarter past eight', 'half past eight', 'a quarter to eight'], '08.45 = lima belas menit sebelum jam sembilan.'),
        ('Time and Days', 'The day after Wednesday is …', 'Thursday', ['Tuesday', 'Friday', 'Monday'], 'Wednesday (Rabu) lalu Thursday (Kamis).'),
        ('Time and Days', 'Independence Day of Indonesia is in …', 'August', ['April', 'October', 'June'], '17 Agustus = August 17th.'),
        ('Time and Days', 'We have breakfast in the …', 'morning', ['night', 'evening', 'midnight'], 'Breakfast = sarapan, di pagi hari.'),
        # Describing Animals
        ('Animals', 'It has a long trunk and big ears. It is an …', 'elephant', ['eagle', 'ant', 'owl'], 'Trunk = belalai, ciri gajah.'),
        ('Animals', 'A cow gives us …', 'milk', ['eggs', 'honey', 'wool'], 'Sapi menghasilkan susu.'),
        ('Animals', 'The rabbit is … than the turtle.', 'faster', ['fast', 'fastest', 'more fast'], 'Perbandingan dua hal: adjective + -er + than.'),
    ],
    '8': [
        # Simple Past
        ('Simple Past', 'Yesterday I … to the library.', 'went', ['go', 'goes', 'going'], 'Yesterday = lampau, go menjadi went.'),
        ('Simple Past', 'She … her homework last night.', 'did', ['does', 'do', 'doing'], 'Last night = lampau, do menjadi did.'),
        ('Simple Past', 'We … not watch TV yesterday.', 'did', ['do', 'does', 'were'], 'Negatif simple past: did not + verb dasar.'),
        ('Simple Past', '"… you visit your grandma last week?"', 'Did', ['Do', 'Does', 'Were'], 'Pertanyaan simple past memakai "Did".'),
        ('Simple Past', 'The past form of "buy" is …', 'bought', ['buyed', 'brought', 'buys'], 'Buy - bought - bought (irregular verb).'),
        ('Simple Past', 'They … at home last Sunday.', 'were', ['was', 'are', 'is'], 'Subjek jamak masa lampau memakai "were".'),
        # Describing People
        ('Describing People', 'Rudi is 180 cm. He is very …', 'tall', ['short', 'fat', 'old'], 'Tall = tinggi (badan).'),
        ('Describing People', 'She always helps her friends. She is …', 'kind', ['lazy', 'rude', 'selfish'], 'Kind = baik hati.'),
        ('Describing People', 'My sister has … hair. It is not straight.', 'curly', ['bald', 'tall', 'thin'], 'Curly = keriting.'),
        ('Describing People', '"What does your brother look like?" asks about his …', 'appearance', ['hobby', 'job', 'address'], '"Look like" menanyakan penampilan fisik.'),
        ('Describing People', 'Andi is the … student in my class.', 'smartest', ['smarter', 'smart', 'more smart'], 'Superlatif untuk lebih dari dua: the + adjective-est.'),
        # Describing Places
        ('Describing Places', 'Borobudur is … than my school.', 'bigger', ['big', 'biggest', 'more big'], 'Comparative: big menjadi bigger.'),
        ('Describing Places', 'A place to borrow books is a …', 'library', ['bakery', 'hospital', 'stadium'], 'Library = perpustakaan.'),
        ('Describing Places', 'The beach is beautiful. The sand is white and the water is …', 'clear', ['noisy', 'crowded', 'dirty'], 'Clear = jernih, cocok menggambarkan air laut yang indah.'),
        ('Describing Places', 'Jakarta is the … city in Indonesia.', 'biggest', ['big', 'bigger', 'more big'], 'Superlatif: the biggest.'),
        ('Describing Places', '"Excuse me, where is the post office?" "Go straight and … left."', 'turn', ['walk', 'stop', 'open'], 'Turn left = belok kiri.'),
        # Asking and Giving Opinion
        ('Opinion', '"What do you think about the movie?" asks for …', 'an opinion', ['a direction', 'permission', 'an apology'], '"What do you think about…" meminta pendapat.'),
        ('Opinion', 'Which one shows agreement?', 'I agree with you.', ['I disagree.', "I don't think so.", "That's not right."], '"I agree" = setuju.'),
        ('Opinion', '"I\'m sorry I\'m late." The best reply is …', "That's okay.", ['Thank you.', 'Congratulations.', 'Nice to meet you.'], 'Permintaan maaf dibalas "That\'s okay" atau "No problem".'),
        ('Opinion', '"May I borrow your pen?" asks for …', 'permission', ['opinion', 'direction', 'information about time'], '"May I…" meminta izin.'),
        # Recount
        ('Recount Text', 'A recount text tells about …', 'past events or experiences', ['how to make something', 'a future plan', 'a product for sale'], 'Recount menceritakan pengalaman masa lalu.'),
        ('Recount Text', 'The first part of a recount text is the …', 'orientation', ['reorientation', 'events', 'steps'], 'Struktur recount: orientation, events, reorientation.'),
        ('Recount Text', '"Last holiday, my family and I went to Bali." This sentence is the …', 'orientation', ['events', 'reorientation', 'goal'], 'Orientation memperkenalkan siapa, kapan, dan di mana.'),
        ('Recount Text', 'Which word shows sequence in a recount?', 'Then', ['Because', 'But', 'Although'], '"Then" menunjukkan urutan kejadian.'),
        ('Recount Text', '"It was a wonderful trip." This closing is the …', 'reorientation', ['orientation', 'events', 'materials'], 'Reorientation berisi kesan atau penutup.'),
    ],
    '9': [
        # Future
        ('Future Tense', 'Tomorrow we … visit the museum.', 'will', ['were', 'did', 'was'], 'Tomorrow = masa depan, memakai will.'),
        ('Future Tense', 'Look at the dark clouds! It is going … rain.', 'to', ['for', 'at', 'in'], 'Pola: be going to + verb dasar.'),
        ('Future Tense', 'She will … to Surabaya next week.', 'go', ['goes', 'went', 'going'], 'Setelah will memakai verb dasar.'),
        ('Future Tense', '"Will you come to my party?" "Yes, I …"', 'will', ['do', 'am', 'did'], 'Jawaban singkat pertanyaan "Will you…" adalah "Yes, I will".'),
        ('Future Tense', 'I … going to study tonight.', 'am', ['is', 'are', 'will'], 'Subjek I + am going to.'),
        # Procedure Text
        ('Procedure Text', 'The purpose of a procedure text is to …', 'tell how to make or do something', ['tell a past experience', 'describe a person', 'advertise a product'], 'Procedure text berisi langkah-langkah.'),
        ('Procedure Text', '"First, boil the water." The verb "boil" is in the form of …', 'imperative', ['past tense', 'future tense', 'passive voice'], 'Langkah prosedur memakai kalimat perintah (imperative).'),
        ('Procedure Text', 'In a recipe, "ingredients" means …', 'the things we need', ['the steps', 'the title', 'the result'], 'Ingredients = bahan-bahan.'),
        ('Procedure Text', 'Which word shows the last step?', 'Finally', ['First', 'Next', 'Then'], '"Finally" menandai langkah terakhir.'),
        ('Procedure Text', '"… the noodles into the boiling water." The right verb is …', 'Put', ['Puts', 'Putting', 'To put'], 'Kalimat perintah memakai verb dasar.'),
        # Announcement and Advertisement
        ('Announcement', 'An announcement gives …', 'important information to the public', ['a story about a hero', 'steps to make food', 'a personal letter'], 'Pengumuman memberi informasi penting untuk umum.'),
        ('Announcement', '"All students must gather in the hall at 7 a.m." The word "gather" means …', 'come together', ['go home', 'sleep', 'run away'], 'Gather = berkumpul.'),
        ('Announcement', 'The main purpose of an advertisement is to …', 'persuade people to buy or use something', ['tell a funny story', 'explain a past event', 'describe an animal'], 'Iklan bertujuan membujuk.'),
        ('Announcement', '"Buy 1 get 1 free!" means you …', 'get two items for the price of one', ['pay for two items', 'get nothing', 'must buy ten items'], 'Beli satu gratis satu.'),
        ('Announcement', '"The library will be closed on Friday." The library is closed on …', 'Friday', ['Thursday', 'Saturday', 'every day'], 'Informasi tersurat dalam pengumuman.'),
        # Passive Voice
        ('Passive Voice', 'The letter … by Rina yesterday.', 'was written', ['is written', 'wrote', 'was write'], 'Passive lampau: was/were + verb 3.'),
        ('Passive Voice', 'English … in many countries.', 'is spoken', ['speaks', 'is speak', 'spoke'], 'Passive present: is/are + verb 3.'),
        ('Passive Voice', 'The active form of "The cake was made by Mom" is …', 'Mom made the cake.', ['Mom makes the cake.', 'The cake made Mom.', 'Mom was made the cake.'], 'Kalimat aktif lampau: subjek + verb 2 + objek.'),
        ('Passive Voice', 'The past participle (verb 3) of "eat" is …', 'eaten', ['ate', 'eated', 'eating'], 'Eat - ate - eaten.'),
        # Report Text and Vocabulary
        ('Report Text', 'A report text describes things …', 'in general, based on facts', ['as a personal story', 'as a funny joke', 'as steps to follow'], 'Report text menjelaskan sesuatu secara umum dan faktual.'),
        ('Report Text', '"Whales are mammals. They breathe with lungs." This text is a …', 'report text', ['recount text', 'procedure text', 'narrative text'], 'Berisi fakta umum tentang paus.'),
        ('Report Text', 'The opposite of "dangerous" is …', 'safe', ['scary', 'risky', 'harmful'], 'Dangerous = berbahaya, safe = aman.'),
        ('Report Text', '"Herbivores eat plants." "Herbivores" are animals that eat …', 'only plants', ['only meat', 'plants and meat', 'insects only'], 'Herbivora pemakan tumbuhan.'),
        ('Report Text', 'Komodo dragons live on Komodo Island. The word "live" means …', 'tinggal', ['makan', 'berburu', 'tidur'], 'Live = tinggal atau hidup.'),
        ('Report Text', 'The synonym of "huge" is …', 'very big', ['very small', 'very fast', 'very old'], 'Huge = sangat besar.'),
    ],
}


def bank():
    r = random.Random(2028)
    hasil = []
    for kelas, daftar in S.items():
        for topik, teks, benar, salah, jelas in daftar:
            ops = [benar] + list(salah)
            assert len(set(ops)) == 4, teks
            r.shuffle(ops)
            hasil.append({'kelas': kelas, 'topik': topik, 'soal': teks, 'a': ops[0], 'b': ops[1], 'c': ops[2], 'd': ops[3],
                          'kunci': 'ABCD'[ops.index(benar)], 'jelas': jelas})
    return hasil


if __name__ == '__main__':
    b = bank()
    print(len(b), {k: sum(1 for x in b if x['kelas'] == k) for k in '789'}, {h: sum(1 for x in b if x['kunci'] == h) for h in 'ABCD'})
