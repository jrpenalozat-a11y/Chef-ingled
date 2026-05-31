import React, { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// CONTENIDO: 14 días · 5 frases por día · gastronomía / servicio
// ─────────────────────────────────────────────────────────────
const CURRICULUM = [
  {
    day: 1, theme: "Recibir al cliente",
    phrases: [
      { en: "Good evening, welcome! Do you have a reservation?", es: "Buenas noches, ¡bienvenido! ¿Tiene reserva?", ipa: "ɡʊd ˈiːvnɪŋ ˈwɛlkəm duː juː hæv ə ˌrɛzərˈveɪʃən" },
      { en: "A table for two? Right this way, please.", es: "¿Mesa para dos? Por aquí, por favor.", ipa: "ə ˈteɪbəl fɔːr tuː raɪt ðɪs weɪ pliːz" },
      { en: "Can I take your coat?", es: "¿Le tomo el abrigo?", ipa: "kæn aɪ teɪk jɔːr koʊt" },
      { en: "Would you prefer a table inside or on the terrace?", es: "¿Prefiere mesa adentro o en la terraza?", ipa: "wʊd juː prɪˈfɜːr ə ˈteɪbəl ɪnˈsaɪd ɔːr ɒn ðə ˈtɛrəs" },
      { en: "I'll be your server tonight.", es: "Seré su mesero/a esta noche.", ipa: "aɪl biː jɔːr ˈsɜːrvər təˈnaɪt" },
    ],
  },
  {
    day: 2, theme: "Tomar el pedido",
    phrases: [
      { en: "Are you ready to order, or do you need a few more minutes?", es: "¿Listos para ordenar o necesitan unos minutos más?", ipa: "ɑːr juː ˈrɛdi tuː ˈɔːrdər ɔːr duː juː niːd ə fjuː mɔːr ˈmɪnɪts" },
      { en: "Can I start you off with something to drink?", es: "¿Empezamos con algo de tomar?", ipa: "kæn aɪ stɑːrt juː ɒf wɪð ˈsʌmθɪŋ tuː drɪŋk" },
      { en: "How would you like your steak cooked?", es: "¿Cómo desea su carne?", ipa: "haʊ wʊd juː laɪk jɔːr steɪk kʊkt" },
      { en: "Would you like to hear today's specials?", es: "¿Le gustaría conocer las sugerencias del día?", ipa: "wʊd juː laɪk tuː hɪər təˈdeɪz ˈspɛʃəlz" },
      { en: "Excellent choice. I'll bring that right out.", es: "Excelente elección. Se lo traigo enseguida.", ipa: "ˈɛksələnt tʃɔɪs aɪl brɪŋ ðæt raɪt aʊt" },
    ],
  },
  {
    day: 3, theme: "Describir platos",
    phrases: [
      { en: "It's a grilled salmon served with seasonal vegetables.", es: "Es salmón a la parrilla con verduras de estación.", ipa: "ɪts ə ɡrɪld ˈsæmən sɜːrvd wɪð ˈsiːzənəl ˈvɛdʒtəbəlz" },
      { en: "This dish is mildly spicy.", es: "Este plato es ligeramente picante.", ipa: "ðɪs dɪʃ ɪz ˈmaɪldli ˈspaɪsi" },
      { en: "The sauce is made in house.", es: "La salsa es de elaboración propia.", ipa: "ðə sɔːs ɪz meɪd ɪn haʊs" },
      { en: "It comes with a side of mashed potatoes.", es: "Viene con una guarnición de puré de papas.", ipa: "ɪt kʌmz wɪð ə saɪd ɒv mæʃt pəˈteɪtoʊz" },
      { en: "It pairs really well with a red wine.", es: "Marida muy bien con un vino tinto.", ipa: "ɪt pɛərz ˈrɪli wɛl wɪð ə rɛd waɪn" },
    ],
  },
  {
    day: 4, theme: "Alergias y dietas",
    phrases: [
      { en: "Do you have any food allergies or dietary restrictions?", es: "¿Tiene alguna alergia o restricción alimentaria?", ipa: "duː juː hæv ˈɛni fuːd ˈælərdʒiz ɔːr ˈdaɪətɛri rɪˈstrɪkʃənz" },
      { en: "This dish is gluten-free.", es: "Este plato es libre de gluten.", ipa: "ðɪs dɪʃ ɪz ˈɡluːtən friː" },
      { en: "We can prepare it without nuts.", es: "Podemos prepararlo sin frutos secos.", ipa: "wiː kæn prɪˈpɛər ɪt wɪˈðaʊt nʌts" },
      { en: "Is this suitable for vegetarians?", es: "¿Esto es apto para vegetarianos?", ipa: "ɪz ðɪs ˈsuːtəbəl fɔːr ˌvɛdʒəˈtɛəriənz" },
      { en: "Let me check with the kitchen for you.", es: "Permítame consultarlo con la cocina.", ipa: "lɛt miː tʃɛk wɪð ðə ˈkɪtʃən fɔːr juː" },
    ],
  },
  {
    day: 5, theme: "Durante la comida",
    phrases: [
      { en: "How is everything tasting?", es: "¿Qué tal está todo?", ipa: "haʊ ɪz ˈɛvriθɪŋ ˈteɪstɪŋ" },
      { en: "Can I get you anything else?", es: "¿Desea algo más?", ipa: "kæn aɪ ɡɛt juː ˈɛniθɪŋ ɛls" },
      { en: "Let me refill your water.", es: "Le relleno el agua.", ipa: "lɛt miː ˈriːfɪl jɔːr ˈwɔːtər" },
      { en: "I'll clear these plates for you.", es: "Le retiro estos platos.", ipa: "aɪl klɪər ðiːz pleɪts fɔːr juː" },
      { en: "Take your time, there's no rush.", es: "Tómese su tiempo, no hay apuro.", ipa: "teɪk jɔːr taɪm ðɛərz noʊ rʌʃ" },
    ],
  },
  {
    day: 6, theme: "Resolver problemas",
    phrases: [
      { en: "I'm so sorry about that. Let me fix it right away.", es: "Lamento mucho eso. Permítame solucionarlo enseguida.", ipa: "aɪm soʊ ˈsɒri əˈbaʊt ðæt lɛt miː fɪks ɪt raɪt əˈweɪ" },
      { en: "I'll bring you a fresh one.", es: "Le traigo uno nuevo.", ipa: "aɪl brɪŋ juː ə frɛʃ wʌn" },
      { en: "Of course, I'll take that off the bill.", es: "Por supuesto, lo descuento de la cuenta.", ipa: "ɒv kɔːrs aɪl teɪk ðæt ɒf ðə bɪl" },
      { en: "Thank you for letting me know.", es: "Gracias por avisarme.", ipa: "θæŋk juː fɔːr ˈlɛtɪŋ miː noʊ" },
      { en: "Is there anything I can do to make it right?", es: "¿Hay algo que pueda hacer para compensarlo?", ipa: "ɪz ðɛər ˈɛniθɪŋ aɪ kæn duː tuː meɪk ɪt raɪt" },
    ],
  },
  {
    day: 7, theme: "La cuenta",
    phrases: [
      { en: "Would you like the bill all together or separately?", es: "¿La cuenta junta o por separado?", ipa: "wʊd juː laɪk ðə bɪl ɔːl təˈɡɛðər ɔːr ˈsɛprətli" },
      { en: "How would you like to pay?", es: "¿Cómo desea pagar?", ipa: "haʊ wʊd juː laɪk tuː peɪ" },
      { en: "We accept cash and card.", es: "Aceptamos efectivo y tarjeta.", ipa: "wiː əkˈsɛpt kæʃ ænd kɑːrd" },
      { en: "The tip is not included.", es: "La propina no está incluida.", ipa: "ðə tɪp ɪz nɒt ɪnˈkluːdɪd" },
      { en: "Thank you, have a great night!", es: "Gracias, ¡que tenga buena noche!", ipa: "θæŋk juː hæv ə ɡreɪt naɪt" },
    ],
  },
  {
    day: 8, theme: "En la cocina",
    phrases: [
      { en: "Order up! Table five.", es: "¡Listo para servir! Mesa cinco.", ipa: "ˈɔːrdər ʌp ˈteɪbəl faɪv" },
      { en: "We're out of the salmon.", es: "Se nos acabó el salmón.", ipa: "wɪr aʊt ɒv ðə ˈsæmən" },
      { en: "Can you fire the appetizers?", es: "¿Puedes mandar las entradas?", ipa: "kæn juː ˈfaɪər ðiː ˈæpɪtaɪzərz" },
      { en: "This needs to go out hot.", es: "Esto tiene que salir caliente.", ipa: "ðɪs niːdz tuː ɡoʊ aʊt hɒt" },
      { en: "Behind you, hot pan!", es: "¡Detrás de ti, sartén caliente!", ipa: "bɪˈhaɪnd juː hɒt pæn" },
    ],
  },
  {
    day: 9, theme: "En el bar",
    phrases: [
      { en: "What can I get started for you?", es: "¿Qué le preparo?", ipa: "wɒt kæn aɪ ɡɛt ˈstɑːrtɪd fɔːr juː" },
      { en: "Would you like that on the rocks or neat?", es: "¿Lo desea con hielo o solo?", ipa: "wʊd juː laɪk ðæt ɒn ðə rɒks ɔːr niːt" },
      { en: "Can I see some ID, please?", es: "¿Me muestra una identificación, por favor?", ipa: "kæn aɪ siː sʌm ˌaɪˈdiː pliːz" },
      { en: "Last call for drinks.", es: "Última ronda de tragos.", ipa: "lɑːst kɔːl fɔːr drɪŋks" },
      { en: "This one's on the house.", es: "Esta va por la casa.", ipa: "ðɪs wʌnz ɒn ðə haʊs" },
    ],
  },
  {
    day: 10, theme: "Recomendar",
    phrases: [
      { en: "If I may suggest, the lamb is excellent today.", es: "Si me permite sugerir, el cordero está excelente hoy.", ipa: "ɪf aɪ meɪ səˈdʒɛst ðə læm ɪz ˈɛksələnt təˈdeɪ" },
      { en: "It's one of our most popular dishes.", es: "Es uno de nuestros platos más populares.", ipa: "ɪts wʌn ɒv ˈaʊər moʊst ˈpɒpjələr ˈdɪʃɪz" },
      { en: "For dessert, I'd recommend the cheesecake.", es: "De postre, le recomiendo el cheesecake.", ipa: "fɔːr dɪˈzɜːrt aɪd ˌrɛkəˈmɛnd ðə ˈtʃiːzkeɪk" },
      { en: "It's light, perfect after a big meal.", es: "Es ligero, perfecto tras una comida abundante.", ipa: "ɪts laɪt ˈpɜːrfɪkt ˈɑːftər ə bɪɡ miːl" },
      { en: "Trust me, you won't be disappointed.", es: "Confíe en mí, no se va a decepcionar.", ipa: "trʌst miː juː woʊnt biː ˌdɪsəˈpɔɪntɪd" },
    ],
  },
  {
    day: 11, theme: "Reservas por teléfono",
    phrases: [
      { en: "Thank you for calling, how may I help you?", es: "Gracias por llamar, ¿en qué puedo ayudarle?", ipa: "θæŋk juː fɔːr ˈkɔːlɪŋ haʊ meɪ aɪ hɛlp juː" },
      { en: "For what date and time?", es: "¿Para qué fecha y hora?", ipa: "fɔːr wɒt deɪt ænd taɪm" },
      { en: "How many people will be in your party?", es: "¿Para cuántas personas?", ipa: "haʊ ˈmɛni ˈpiːpəl wɪl biː ɪn jɔːr ˈpɑːrti" },
      { en: "Could I have a name for the reservation?", es: "¿Me da un nombre para la reserva?", ipa: "kʊd aɪ hæv ə neɪm fɔːr ðə ˌrɛzərˈveɪʃən" },
      { en: "We look forward to seeing you.", es: "Lo esperamos con gusto.", ipa: "wiː lʊk ˈfɔːrwərd tuː ˈsiːɪŋ juː" },
    ],
  },
  {
    day: 12, theme: "Vinos y maridaje",
    phrases: [
      { en: "Would you like to see the wine list?", es: "¿Desea ver la carta de vinos?", ipa: "wʊd juː laɪk tuː siː ðə waɪn lɪst" },
      { en: "This is a dry, full-bodied red.", es: "Es un tinto seco y con cuerpo.", ipa: "ðɪs ɪz ə draɪ ˈfʊlˈbɒdid rɛd" },
      { en: "May I pour you a taste first?", es: "¿Le sirvo una cata primero?", ipa: "meɪ aɪ pɔːr juː ə teɪst fɜːrst" },
      { en: "It has notes of cherry and oak.", es: "Tiene notas de cereza y roble.", ipa: "ɪt hæz noʊts ɒv ˈtʃɛri ænd oʊk" },
      { en: "Shall I leave the bottle on the table?", es: "¿Dejo la botella en la mesa?", ipa: "ʃæl aɪ liːv ðə ˈbɒtəl ɒn ðə ˈteɪbəl" },
    ],
  },
  {
    day: 13, theme: "Despedida y fidelizar",
    phrases: [
      { en: "I hope you enjoyed your meal.", es: "Espero que haya disfrutado su comida.", ipa: "aɪ hoʊp juː ɪnˈdʒɔɪd jɔːr miːl" },
      { en: "Please come back and see us soon.", es: "Por favor, vuelva a vernos pronto.", ipa: "pliːz kʌm bæk ænd siː ʌs suːn" },
      { en: "Here's our card if you'd like to book again.", es: "Aquí tiene nuestra tarjeta si desea reservar de nuevo.", ipa: "hɪrz ˈaʊər kɑːrd ɪf juːd laɪk tuː bʊk əˈɡɛn" },
      { en: "It was a pleasure serving you.", es: "Fue un placer atenderle.", ipa: "ɪt wɒz ə ˈplɛʒər ˈsɜːrvɪŋ juː" },
      { en: "Drive safely, good night!", es: "Maneje con cuidado, ¡buenas noches!", ipa: "draɪv ˈseɪfli ɡʊd naɪt" },
    ],
  },
  {
    day: 14, theme: "Frases de equipo",
    phrases: [
      { en: "I've got table seven covered.", es: "Yo me encargo de la mesa siete.", ipa: "aɪv ɡɒt ˈteɪbəl ˈsɛvən ˈkʌvərd" },
      { en: "Can you give me a hand running food?", es: "¿Me das una mano sacando los platos?", ipa: "kæn juː ɡɪv miː ə hænd ˈrʌnɪŋ fuːd" },
      { en: "We're slammed tonight.", es: "Estamos a tope esta noche.", ipa: "wɪr slæmd təˈnaɪt" },
      { en: "Let's reset this table for the next guests.", es: "Preparemos esta mesa para los próximos clientes.", ipa: "lɛts ˌriːˈsɛt ðɪs ˈteɪbəl fɔːr ðə nɛkst ɡɛsts" },
      { en: "Great work today, team.", es: "Buen trabajo hoy, equipo.", ipa: "ɡreɪt wɜːrk təˈdeɪ tiːm" },
    ],
  },
  {
    day: 15, theme: "Sentar a los comensales",
    phrases: [
      { en: "Your table is ready, please follow me.", es: "Su mesa está lista, sígame por favor.", ipa: "jɔːr ˈteɪbəl ɪz ˈrɛdi pliːz ˈfɒloʊ miː" },
      { en: "Would this table be alright for you?", es: "¿Esta mesa le parece bien?", ipa: "wʊd ðɪs ˈteɪbəl biː ɔːlˈraɪt fɔːr juː" },
      { en: "Please, have a seat.", es: "Por favor, tome asiento.", ipa: "pliːz hæv ə siːt" },
      { en: "Can I bring a high chair for the little one?", es: "¿Le traigo una sillita para el pequeño?", ipa: "kæn aɪ brɪŋ ə haɪ tʃɛər fɔːr ðə ˈlɪtəl wʌn" },
      { en: "Here are your menus. I'll give you a moment.", es: "Aquí tienen las cartas. Les doy un momento.", ipa: "hɪər ɑːr jɔːr ˈmɛnjuːz aɪl ɡɪv juː ə ˈmoʊmənt" },
    ],
  },
  {
    day: 16, theme: "Presentar la carta",
    phrases: [
      { en: "Have you dined with us before?", es: "¿Nos ha visitado antes?", ipa: "hæv juː daɪnd wɪð ʌs bɪˈfɔːr" },
      { en: "Our menu is divided into starters, mains and desserts.", es: "Nuestra carta se divide en entradas, principales y postres.", ipa: "ˈaʊər ˈmɛnjuː ɪz dɪˈvaɪdɪd ˈɪntuː ˈstɑːrtərz meɪnz ænd dɪˈzɜːrts" },
      { en: "The dishes marked here are our chef's signatures.", es: "Los platos marcados aquí son los de autor del chef.", ipa: "ðə ˈdɪʃɪz mɑːrkt hɪər ɑːr ˈaʊər ʃɛfs ˈsɪɡnətʃərz" },
      { en: "Everything is freshly prepared, so it may take a little time.", es: "Todo se prepara al momento, puede tomar un poco de tiempo.", ipa: "ˈɛvriθɪŋ ɪz ˈfrɛʃli prɪˈpɛərd soʊ ɪt meɪ teɪk ə ˈlɪtəl taɪm" },
      { en: "Please let me know if you have any questions.", es: "Avíseme si tiene alguna pregunta.", ipa: "pliːz lɛt miː noʊ ɪf juː hæv ˈɛni ˈkwɛstʃənz" },
    ],
  },
  {
    day: 17, theme: "Sugerir bebidas en mesa",
    phrases: [
      { en: "Can I bring you some water while you decide? Still or sparkling?", es: "¿Le traigo agua mientras decide? ¿Sin gas o con gas?", ipa: "kæn aɪ brɪŋ juː sʌm ˈwɔːtər waɪl juː dɪˈsaɪd stɪl ɔːr ˈspɑːrklɪŋ" },
      { en: "Would you care for a drink before your meal?", es: "¿Desea una bebida antes de la comida?", ipa: "wʊd juː kɛər fɔːr ə drɪŋk bɪˈfɔːr jɔːr miːl" },
      { en: "We have a nice house wine by the glass.", es: "Tenemos un buen vino de la casa por copa.", ipa: "wiː hæv ə naɪs haʊs waɪn baɪ ðə ɡlɑːs" },
      { en: "Can I get those drinks started for you?", es: "¿Le voy preparando esas bebidas?", ipa: "kæn aɪ ɡɛt ðoʊz drɪŋks ˈstɑːrtɪd fɔːr juː" },
      { en: "I'll be right back with your drinks.", es: "Vuelvo enseguida con sus bebidas.", ipa: "aɪl biː raɪt bæk wɪð jɔːr drɪŋks" },
    ],
  },
  {
    day: 18, theme: "Anotar el pedido con detalle",
    phrases: [
      { en: "And for your starter?", es: "¿Y de entrada?", ipa: "ænd fɔːr jɔːr ˈstɑːrtər" },
      { en: "Would you like that as a starter or a main?", es: "¿Lo desea de entrada o de principal?", ipa: "wʊd juː laɪk ðæt æz ə ˈstɑːrtər ɔːr ə meɪn" },
      { en: "Any sides with that?", es: "¿Alguna guarnición con eso?", ipa: "ˈɛni saɪdz wɪð ðæt" },
      { en: "Let me read that back to you.", es: "Permítame repetirle el pedido.", ipa: "lɛt miː riːd ðæt bæk tuː juː" },
      { en: "Would you like everything brought out together?", es: "¿Desea que traigamos todo junto?", ipa: "wʊd juː laɪk ˈɛvriθɪŋ brɔːt aʊt təˈɡɛðər" },
    ],
  },
  {
    day: 19, theme: "Modificar y personalizar",
    phrases: [
      { en: "Of course, I can leave the onions off.", es: "Por supuesto, puedo dejarlo sin cebolla.", ipa: "ɒv kɔːrs aɪ kæn liːv ðiː ˈʌnjənz ɒf" },
      { en: "Would you like the dressing on the side?", es: "¿Desea el aderezo aparte?", ipa: "wʊd juː laɪk ðə ˈdrɛsɪŋ ɒn ðə saɪd" },
      { en: "We can make that a smaller portion for the child.", es: "Podemos hacerlo en porción más pequeña para el niño.", ipa: "wiː kæn meɪk ðæt ə ˈsmɔːlər ˈpɔːrʃən fɔːr ðə tʃaɪld" },
      { en: "Let me check if the kitchen can do that.", es: "Déjeme ver si la cocina puede hacerlo.", ipa: "lɛt miː tʃɛk ɪf ðə ˈkɪtʃən kæn duː ðæt" },
      { en: "Absolutely, no problem at all.", es: "Claro que sí, ningún problema.", ipa: "ˈæbsəluːtli noʊ ˈprɒbləm æt ɔːl" },
    ],
  },
  {
    day: 20, theme: "Servir los platos en mesa",
    phrases: [
      { en: "Here you are. Careful, the plate is hot.", es: "Aquí tiene. Cuidado, el plato está caliente.", ipa: "hɪər juː ɑːr ˈkɛərfəl ðə pleɪt ɪz hɒt" },
      { en: "Who ordered the grilled chicken?", es: "¿Quién pidió el pollo a la parrilla?", ipa: "huː ˈɔːrdərd ðə ɡrɪld ˈtʃɪkɪn" },
      { en: "Can I grind some fresh pepper on that?", es: "¿Le pongo pimienta recién molida?", ipa: "kæn aɪ ɡraɪnd sʌm frɛʃ ˈpɛpər ɒn ðæt" },
      { en: "Enjoy your meal!", es: "¡Que disfrute su comida!", ipa: "ɪnˈdʒɔɪ jɔːr miːl" },
      { en: "I'll bring the rest of your order in just a moment.", es: "Le traigo el resto del pedido en un momento.", ipa: "aɪl brɪŋ ðə rɛst ɒv jɔːr ˈɔːrdər ɪn dʒʌst ə ˈmoʊmənt" },
    ],
  },
  {
    day: 21, theme: "Atención durante la comida",
    phrases: [
      { en: "Is everything to your liking?", es: "¿Está todo a su gusto?", ipa: "ɪz ˈɛvriθɪŋ tuː jɔːr ˈlaɪkɪŋ" },
      { en: "Would you like some more bread?", es: "¿Desea más pan?", ipa: "wʊd juː laɪk sʌm mɔːr brɛd" },
      { en: "Shall I bring another round of drinks?", es: "¿Le traigo otra ronda de bebidas?", ipa: "ʃæl aɪ brɪŋ əˈnʌðər raʊnd ɒv drɪŋks" },
      { en: "May I clear this for you?", es: "¿Le retiro esto?", ipa: "meɪ aɪ klɪər ðɪs fɔːr juː" },
      { en: "Just wave me over if you need anything.", es: "Hágame una seña si necesita algo.", ipa: "dʒʌst weɪv miː ˈoʊvər ɪf juː niːd ˈɛniθɪŋ" },
    ],
  },
  {
    day: 22, theme: "Manejar mesas grandes",
    phrases: [
      { en: "Are you all together, or separate checks?", es: "¿Van todos juntos o cuentas separadas?", ipa: "ɑːr juː ɔːl təˈɡɛðər ɔːr ˈsɛprət tʃɛks" },
      { en: "I'll take the orders one by one, please.", es: "Tomaré los pedidos uno por uno, por favor.", ipa: "aɪl teɪk ðiː ˈɔːrdərz wʌn baɪ wʌn pliːz" },
      { en: "Let me pull up another chair for you.", es: "Le acerco otra silla.", ipa: "lɛt miː pʊl ʌp əˈnʌðər tʃɛər fɔːr juː" },
      { en: "I'll bring the children's plates out first.", es: "Sacaré primero los platos de los niños.", ipa: "aɪl brɪŋ ðə ˈtʃɪldrənz pleɪts aʊt fɜːrst" },
      { en: "Don't worry, I'll keep track of who had what.", es: "No se preocupe, llevaré la cuenta de quién pidió qué.", ipa: "doʊnt ˈwʌri aɪl kiːp træk ɒv huː hæd wɒt" },
    ],
  },
  {
    day: 23, theme: "Ofrecer postre y café",
    phrases: [
      { en: "Would you care to see the dessert menu?", es: "¿Desea ver la carta de postres?", ipa: "wʊd juː kɛər tuː siː ðə dɪˈzɜːrt ˈmɛnjuː" },
      { en: "Can I tempt you with something sweet?", es: "¿Le tiento con algo dulce?", ipa: "kæn aɪ tɛmpt juː wɪð ˈsʌmθɪŋ swiːt" },
      { en: "Would you like coffee or tea with that?", es: "¿Desea café o té con eso?", ipa: "wʊd juː laɪk ˈkɒfi ɔːr tiː wɪð ðæt" },
      { en: "The desserts are perfect for sharing.", es: "Los postres son perfectos para compartir.", ipa: "ðə dɪˈzɜːrts ɑːr ˈpɜːrfɪkt fɔːr ˈʃɛərɪŋ" },
      { en: "How about a coffee to finish?", es: "¿Qué tal un café para terminar?", ipa: "haʊ əˈbaʊt ə ˈkɒfi tuː ˈfɪnɪʃ" },
    ],
  },
  {
    day: 24, theme: "Lidiar con esperas",
    phrases: [
      { en: "Thank you for your patience, it won't be long.", es: "Gracias por su paciencia, no tardará mucho.", ipa: "θæŋk juː fɔːr jɔːr ˈpeɪʃəns ɪt woʊnt biː lɒŋ" },
      { en: "Your food is just being plated now.", es: "Su comida se está emplatando ahora mismo.", ipa: "jɔːr fuːd ɪz dʒʌst ˈbiːɪŋ ˈpleɪtɪd naʊ" },
      { en: "I'm so sorry for the wait.", es: "Lamento mucho la espera.", ipa: "aɪm soʊ ˈsɒri fɔːr ðə weɪt" },
      { en: "Can I bring you some bread in the meantime?", es: "¿Le traigo algo de pan mientras tanto?", ipa: "kæn aɪ brɪŋ juː sʌm brɛd ɪn ðə ˈmiːntaɪm" },
      { en: "Let me check on that for you right away.", es: "Déjeme verificarlo enseguida.", ipa: "lɛt miː tʃɛk ɒn ðæt fɔːr juː raɪt əˈweɪ" },
    ],
  },
  {
    day: 25, theme: "Quejas en mesa con tacto",
    phrases: [
      { en: "I'm very sorry, let me make this right for you.", es: "Lo siento mucho, déjeme arreglarlo.", ipa: "aɪm ˈvɛri ˈsɒri lɛt miː meɪk ðɪs raɪt fɔːr juː" },
      { en: "Would you like me to bring you something else instead?", es: "¿Desea que le traiga otra cosa en su lugar?", ipa: "wʊd juː laɪk miː tuː brɪŋ juː ˈsʌmθɪŋ ɛls ɪnˈstɛd" },
      { en: "I completely understand, and I apologize.", es: "Lo entiendo perfectamente, y le pido disculpas.", ipa: "aɪ kəmˈpliːtli ˌʌndərˈstænd ænd aɪ əˈpɒlədʒaɪz" },
      { en: "I'll speak with my manager right away.", es: "Hablaré con mi encargado enseguida.", ipa: "aɪl spiːk wɪð maɪ ˈmænɪdʒər raɪt əˈweɪ" },
      { en: "Please accept this with our apologies.", es: "Por favor, acepte esto con nuestras disculpas.", ipa: "pliːz əkˈsɛpt ðɪs wɪð ˈaʊər əˈpɒlədʒiz" },
    ],
  },
  {
    day: 26, theme: "Comensales con apuro",
    phrases: [
      { en: "Are you in a hurry? I can speed things up.", es: "¿Tiene prisa? Puedo agilizarlo.", ipa: "ɑːr juː ɪn ə ˈhʌri aɪ kæn spiːd θɪŋz ʌp" },
      { en: "I'd recommend a dish that comes out quickly.", es: "Le recomendaría un plato que sale rápido.", ipa: "aɪd ˌrɛkəˈmɛnd ə dɪʃ ðæt kʌmz aʊt ˈkwɪkli" },
      { en: "I'll bring your bill with the food to save time.", es: "Le traeré la cuenta con la comida para ahorrar tiempo.", ipa: "aɪl brɪŋ jɔːr bɪl wɪð ðə fuːd tuː seɪv taɪm" },
      { en: "No problem, I'll have you out in time.", es: "Sin problema, lo dejaré listo a tiempo.", ipa: "noʊ ˈprɒbləm aɪl hæv juː aʊt ɪn taɪm" },
      { en: "Would you like that to go instead?", es: "¿Lo prefiere para llevar?", ipa: "wʊd juː laɪk ðæt tuː ɡoʊ ɪnˈstɛd" },
    ],
  },
  {
    day: 27, theme: "Ocasiones especiales en mesa",
    phrases: [
      { en: "Are you celebrating something special tonight?", es: "¿Celebran algo especial esta noche?", ipa: "ɑːr juː ˈsɛləbreɪtɪŋ ˈsʌmθɪŋ ˈspɛʃəl təˈnaɪt" },
      { en: "Happy birthday! This dessert is on us.", es: "¡Feliz cumpleaños! Este postre va por la casa.", ipa: "ˈhæpi ˈbɜːrθdeɪ ðɪs dɪˈzɜːrt ɪz ɒn ʌs" },
      { en: "Would you like me to bring it out with a candle?", es: "¿Desea que lo saque con una vela?", ipa: "wʊd juː laɪk miː tuː brɪŋ ɪt aʊt wɪð ə ˈkændəl" },
      { en: "Congratulations to you both!", es: "¡Felicitaciones a ambos!", ipa: "kənˌɡrætʃəˈleɪʃənz tuː juː boʊθ" },
      { en: "Let me know if there's anything I can do to make it memorable.", es: "Avíseme si puedo hacer algo para que sea memorable.", ipa: "lɛt miː noʊ ɪf ðɛərz ˈɛniθɪŋ aɪ kæn duː tuː meɪk ɪt ˈmɛmərəbəl" },
    ],
  },
  {
    day: 28, theme: "Cerrar la cuenta en mesa",
    phrases: [
      { en: "Whenever you're ready, there's no rush.", es: "Cuando guste, no hay prisa.", ipa: "wɛnˈɛvər jʊr ˈrɛdi ðɛərz noʊ rʌʃ" },
      { en: "Here is your bill. I'll take it whenever you're set.", es: "Aquí tiene la cuenta. La retiro cuando esté listo.", ipa: "hɪər ɪz jɔːr bɪl aɪl teɪk ɪt wɛnˈɛvər jʊr sɛt" },
      { en: "Would you like the receipt?", es: "¿Desea el comprobante?", ipa: "wʊd juː laɪk ðə rɪˈsiːt" },
      { en: "I'll be right back with your change.", es: "Vuelvo enseguida con su vuelto.", ipa: "aɪl biː raɪt bæk wɪð jɔːr tʃeɪndʒ" },
      { en: "Take your time, no hurry at all.", es: "Tómese su tiempo, sin ningún apuro.", ipa: "teɪk jɔːr taɪm noʊ ˈhʌri æt ɔːl" },
    ],
  },
  {
    day: 29, theme: "Frases de cortesía clave",
    phrases: [
      { en: "My pleasure.", es: "Es un placer.", ipa: "maɪ ˈplɛʒər" },
      { en: "Right away, sir / madam.", es: "Enseguida, señor / señora.", ipa: "raɪt əˈweɪ sɜːr ˈmædəm" },
      { en: "I'll be with you in just a moment.", es: "Estaré con usted en un momento.", ipa: "aɪl biː wɪð juː ɪn dʒʌst ə ˈmoʊmənt" },
      { en: "Is there anything else I can get for you?", es: "¿Hay algo más que pueda traerle?", ipa: "ɪz ðɛər ˈɛniθɪŋ ɛls aɪ kæn ɡɛt fɔːr juː" },
      { en: "You're very welcome.", es: "De nada, con mucho gusto.", ipa: "jʊr ˈvɛri ˈwɛlkəm" },
    ],
  },
  {
    day: 30, theme: "Despedir al comensal",
    phrases: [
      { en: "Thank you for joining us tonight.", es: "Gracias por acompañarnos esta noche.", ipa: "θæŋk juː fɔːr ˈdʒɔɪnɪŋ ʌs təˈnaɪt" },
      { en: "I hope to see you again soon.", es: "Espero verle pronto de nuevo.", ipa: "aɪ hoʊp tuː siː juː əˈɡɛn suːn" },
      { en: "Mind the step on your way out.", es: "Cuidado con el escalón a la salida.", ipa: "maɪnd ðə stɛp ɒn jɔːr weɪ aʊt" },
      { en: "It was lovely having you with us.", es: "Fue un gusto tenerle con nosotros.", ipa: "ɪt wɒz ˈlʌvli ˈhævɪŋ juː wɪð ʌs" },
      { en: "Have a wonderful evening!", es: "¡Que tenga una excelente noche!", ipa: "hæv ə ˈwʌndərfəl ˈiːvnɪŋ" },
    ],
  },
];

const STORE_KEY = "chefEnglishProgress";

// Error boundary: si algo falla en runtime, muestra aviso en vez de recargar
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ fontFamily: "system-ui", padding: 24, color: "#7a3b1d", background: "#f4e6d4", minHeight: "100vh" }}>
          <h2>Algo falló al ejecutar</h2>
          <p style={{ fontSize: 14, color: "#6b5640" }}>
            Recarga la página o abre el artifact en una pestaña nueva (botón ↗).
          </p>
          <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", opacity: 0.6 }}>
            {String(this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChefEnglish() {
  return (
    <Boundary>
      <ChefEnglishApp />
    </Boundary>
  );
}

function ChefEnglishApp() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [progress, setProgress] = useState({}); // { "1-0": true, ... }
  const [view, setView] = useState("learn"); // learn | quiz
  const [flipped, setFlipped] = useState({});
  const [speaking, setSpeaking] = useState(null); // texto que suena ahora
  const [voicesReady, setVoicesReady] = useState(false);
  const [audioError, setAudioError] = useState("");

  // ── precarga de voces (clave en navegadores Chrome) ──
  useEffect(() => {
    try {
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      if (!synth) return; // sin error al inicio; se avisa solo al tocar escuchar
      const load = () => {
        try {
          const v = synth.getVoices() || [];
          if (v.length > 0) setVoicesReady(true);
        } catch (e) {}
      };
      load();
      try { synth.onvoiceschanged = load; } catch (e) {}
      const t = setTimeout(load, 400);
      return () => clearTimeout(t);
    } catch (e) {}
  }, []);

  // ── persistencia en memoria (sesión) ──
  useEffect(() => {
    try {
      const raw = window.__chefEnglish;
      if (raw) setProgress(raw);
    } catch (e) {}
  }, []);
  useEffect(() => {
    window.__chefEnglish = progress;
  }, [progress]);

  const dayData = CURRICULUM.find((d) => d.day === selectedDay);

  const speak = (text) => {
    try {
      setAudioError("");
      const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
        setAudioError("Tu navegador no soporta audio. Prueba en Chrome o Safari, o abre el artifact en una pestaña nueva (↗).");
        return;
      }
      try { synth.cancel(); } catch (e) {}
      const u = new SpeechSynthesisUtterance(text);
      let voices = [];
      try { voices = synth.getVoices() || []; } catch (e) { voices = []; }
      const enVoice =
        voices.find((v) => /en[-_]US/i.test(v.lang)) ||
        voices.find((v) => /^en/i.test(v.lang));
      if (enVoice) u.voice = enVoice;
      u.lang = "en-US";
      u.rate = 0.9;
      u.onstart = () => { try { setSpeaking(text); } catch (e) {} };
      u.onend = () => { try { setSpeaking(null); } catch (e) {} };
      u.onerror = () => {
        try {
          setSpeaking(null);
          setAudioError("No se pudo reproducir aquí. Abre el artifact en una pestaña nueva (botón ↗) y vuelve a intentar.");
        } catch (e) {}
      };
      synth.speak(u);
    } catch (e) {
      try { setAudioError("No se pudo reproducir el audio en este entorno."); } catch (_) {}
    }
  };

  const toggleLearned = (idx) => {
    const key = `${selectedDay}-${idx}`;
    setProgress((p) => ({ ...p, [key]: !p[key] }));
  };

  const dayLearnedCount = (day) =>
    CURRICULUM.find((d) => d.day === day).phrases.filter(
      (_, i) => progress[`${day}-${i}`]
    ).length;

  const totalLearned = Object.values(progress).filter(Boolean).length;
  const totalPhrases = CURRICULUM.length * 5;
  const pct = Math.round((totalLearned / totalPhrases) * 100);

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.brand}>
          <span style={S.logoMark}>✦</span>
          <div>
            <h1 style={S.title}>Chef's English</h1>
            <p style={S.subtitle}>Servicio de mesas · 30 días · 5 frases al día</p>
          </div>
        </div>
        <div style={S.streakBox}>
          <div style={S.streakNum}>{totalLearned}</div>
          <div style={S.streakLbl}>frases<br/>dominadas</div>
        </div>
      </header>

      {/* PROGRESO GLOBAL */}
      <div style={S.progressWrap}>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>
        <span style={S.progressTxt}>{pct}% del curso completo</span>
      </div>

      {/* AVISO DE AUDIO */}
      {audioError && (
        <div style={S.audioWarn}>⚠ {audioError}</div>
      )}

      {/* SELECTOR DE DÍAS */}
      <div style={S.daysScroll}>
        {CURRICULUM.map((d) => {
          const done = dayLearnedCount(d.day);
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              onClick={() => { setSelectedDay(d.day); setView("learn"); setFlipped({}); }}
              style={{
                ...S.dayChip,
                ...(active ? S.dayChipActive : {}),
                ...(done === 5 ? S.dayChipDone : {}),
              }}
            >
              <span style={S.dayChipNum}>Día {d.day}</span>
              <span style={S.dayChipTheme}>{d.theme}</span>
              <span style={S.dayChipDots}>
                {[0,1,2,3,4].map((i) => (
                  <i key={i} style={{
                    ...S.dot,
                    background: progress[`${d.day}-${i}`] ? "#d4763a" : (active ? "#5c4a3a55" : "#00000018"),
                  }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        <button onClick={() => setView("learn")} style={{...S.tab, ...(view==="learn"?S.tabActive:{})}}>Aprender</button>
        <button onClick={() => setView("quiz")} style={{...S.tab, ...(view==="quiz"?S.tabActive:{})}}>Practicar</button>
      </div>

      {/* CONTENIDO */}
      <main style={S.main}>
        <div style={S.dayHeader}>
          <h2 style={S.dayTitle}>Día {dayData.day}</h2>
          <span style={S.dayTheme}>{dayData.theme}</span>
        </div>

        {view === "learn" ? (
          <div style={S.cardList}>
            {dayData.phrases.map((ph, idx) => {
              const learned = progress[`${selectedDay}-${idx}`];
              return (
                <div key={idx} style={{...S.card, ...(learned ? S.cardLearned : {})}}>
                  <div style={S.cardTop}>
                    <span style={S.cardNum}>{idx + 1}</span>
                    <button style={{...S.speakBtn, ...(speaking===ph.en?S.speakBtnOn:{})}} onClick={() => speak(ph.en)} aria-label="Escuchar">
                      {speaking===ph.en ? "◗ sonando…" : "◗ escuchar"}
                    </button>
                  </div>
                  <p style={S.enText}>{ph.en}</p>
                  <p style={S.ipaText}>/{ph.ipa}/</p>
                  <p style={S.esText}>{ph.es}</p>
                  <button
                    onClick={() => toggleLearned(idx)}
                    style={{...S.learnBtn, ...(learned ? S.learnBtnDone : {})}}
                  >
                    {learned ? "✓ Dominada" : "Marcar como aprendida"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Quiz phrases={dayData.phrases} speak={speak} flipped={flipped} setFlipped={setFlipped} />
        )}
      </main>

      <footer style={S.footer}>
        Toca <b>escuchar</b> para oír la pronunciación · practica en voz alta
      </footer>
    </div>
  );
}

// ── MODO PRÁCTICA: flashcards ES→EN ──
function Quiz({ phrases, speak, flipped, setFlipped }) {
  return (
    <div style={S.quizGrid}>
      {phrases.map((ph, i) => {
        const isFlip = flipped[i];
        return (
          <div
            key={i}
            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
            style={{...S.flash, ...(isFlip ? S.flashBack : {})}}
          >
            {!isFlip ? (
              <>
                <span style={S.flashHint}>traduce al inglés</span>
                <p style={S.flashEs}>{ph.es}</p>
                <span style={S.flashTap}>toca para revelar →</span>
              </>
            ) : (
              <>
                <p style={S.flashEn}>{ph.en}</p>
                <button
                  style={S.flashSpeak}
                  onClick={(e) => { e.stopPropagation(); speak(ph.en); }}
                >◗ escuchar</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Outfit:wght@300;400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; }
::selection { background:#d4763a; color:#fff; }
.ce-scroll::-webkit-scrollbar { height:6px; }
.ce-scroll::-webkit-scrollbar-thumb { background:#c9a98955; border-radius:9px; }
`;

const S = {
  root: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 20% 0%, #f4e6d4 0%, #ece0cf 40%, #e3d4bd 100%)",
    fontFamily: "'Outfit', sans-serif",
    color: "#3a2c1e",
    paddingBottom: 40,
    maxWidth: 760,
    margin: "0 auto",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "28px 24px 18px",
  },
  brand: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: {
    fontSize: 26, color: "#fff", background: "#7a3b1d",
    width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center",
    boxShadow: "0 6px 18px #7a3b1d55",
  },
  title: { fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 27, letterSpacing: -0.5, lineHeight: 1 },
  subtitle: { fontSize: 13, color: "#8a6f54", marginTop: 4, fontWeight: 400 },
  streakBox: {
    textAlign: "center", background: "#fff8ef", borderRadius: 16, padding: "8px 16px",
    border: "1px solid #e3cfb2", boxShadow: "0 4px 14px #00000010",
  },
  streakNum: { fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 26, color: "#d4763a", lineHeight: 1 },
  streakLbl: { fontSize: 9.5, color: "#8a6f54", lineHeight: 1.1, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  progressWrap: { padding: "0 24px 12px", display: "flex", alignItems: "center", gap: 12 },
  progressBar: { flex: 1, height: 8, background: "#00000012", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#d4763a,#a8431f)", borderRadius: 99, transition: "width .5s ease" },
  progressTxt: { fontSize: 12, color: "#8a6f54", whiteSpace: "nowrap", fontWeight: 500 },

  daysScroll: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
    gap: 10, padding: "8px 24px 16px",
  },
  dayChip: {
    width: "100%", textAlign: "left", cursor: "pointer",
    background: "#fff8ef", border: "1px solid #e3cfb2", borderRadius: 16,
    padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
    transition: "all .2s", fontFamily: "'Outfit', sans-serif",
  },
  dayChipActive: { background: "#7a3b1d", borderColor: "#7a3b1d", boxShadow: "0 8px 22px #7a3b1d44", transform: "translateY(-2px)" },
  dayChipDone: { borderColor: "#d4763a" },
  dayChipNum: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 15 },
  dayChipTheme: { fontSize: 11.5, opacity: 0.75, lineHeight: 1.25, minHeight: 28 },
  dayChipDots: { display: "flex", gap: 4, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 99, display: "block" },

  tabs: { display: "flex", gap: 8, padding: "0 24px 4px" },
  tab: {
    flex: 1, padding: "11px", borderRadius: 12, border: "none", cursor: "pointer",
    background: "#00000008", color: "#8a6f54", fontWeight: 600, fontSize: 14,
    fontFamily: "'Outfit', sans-serif", transition: "all .2s",
  },
  tabActive: { background: "#3a2c1e", color: "#f4e6d4" },

  main: { padding: "16px 24px 0" },
  dayHeader: { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 },
  dayTitle: { fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22 },
  dayTheme: { fontSize: 14, color: "#a8431f", fontWeight: 600 },

  cardList: { display: "flex", flexDirection: "column", gap: 14 },
  card: {
    background: "#fffaf3", borderRadius: 20, padding: "18px 20px",
    border: "1px solid #e9d8bf", boxShadow: "0 6px 20px #00000010",
    transition: "all .25s",
  },
  cardLearned: { background: "#fff", borderColor: "#d4763a", boxShadow: "0 6px 22px #d4763a22" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardNum: {
    fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 14, color: "#fff",
    background: "#d4763a", width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center",
  },
  speakBtn: {
    background: "none", border: "1px solid #d4763a", color: "#a8431f", cursor: "pointer",
    fontSize: 12.5, fontWeight: 600, padding: "5px 12px", borderRadius: 99,
    fontFamily: "'Outfit', sans-serif",
  },
  speakBtnOn: { background: "#d4763a", color: "#fff" },
  audioWarn: {
    margin: "0 24px 12px", padding: "10px 14px", borderRadius: 12,
    background: "#fbe9d8", border: "1px solid #e3a06a", color: "#8a4a1d",
    fontSize: 12.5, lineHeight: 1.5, fontWeight: 500,
  },
  enText: { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19, lineHeight: 1.3, color: "#2a1f14" },
  ipaText: { fontSize: 12.5, color: "#b08a5f", fontStyle: "italic", margin: "5px 0 8px" },
  esText: { fontSize: 14.5, color: "#6b5640", marginBottom: 14 },
  learnBtn: {
    width: "100%", padding: "10px", borderRadius: 11, border: "1px solid #e0cba8",
    background: "#fff", color: "#8a6f54", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", transition: "all .2s",
  },
  learnBtnDone: { background: "#d4763a", borderColor: "#d4763a", color: "#fff" },

  quizGrid: { display: "flex", flexDirection: "column", gap: 14 },
  flash: {
    minHeight: 120, borderRadius: 20, padding: "22px 20px", cursor: "pointer",
    background: "#fffaf3", border: "1px solid #e9d8bf", boxShadow: "0 6px 20px #00000010",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: 8,
    transition: "all .2s",
  },
  flashBack: { background: "#3a2c1e" },
  flashHint: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#b08a5f", fontWeight: 600 },
  flashEs: { fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: "#2a1f14" },
  flashTap: { fontSize: 12, color: "#b08a5f", marginTop: 4 },
  flashEn: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "#f4e6d4", lineHeight: 1.3 },
  flashSpeak: {
    alignSelf: "flex-start", marginTop: 8, background: "#d4763a", border: "none", color: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 99,
    fontFamily: "'Outfit', sans-serif",
  },

  footer: { textAlign: "center", fontSize: 12.5, color: "#9c805f", padding: "26px 24px 0", lineHeight: 1.6 },
};
