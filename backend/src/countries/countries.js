// Complete UN member states and observers data with multilingual support
// All 193 UN member states + 2 observers with names in 4 languages

const UN_COUNTRIES = [
    // UN Member States (193 countries)
    {
        code: 'af',
        name: {
            en: 'Afghanistan',
            ru: 'Афганистан',
            uz_lat: 'Afg\'oniston',
            uz_cyr: 'Афғонистон'
        }
    },
    {
        code: 'al',
        name: {
            en: 'Albania',
            ru: 'Албания',
            uz_lat: 'Albaniya',
            uz_cyr: 'Албания'
        }
    },
    {
        code: 'dz',
        name: {
            en: 'Algeria',
            ru: 'Алжир',
            uz_lat: 'Jazoir',
            uz_cyr: 'Жазоир'
        }
    },
    {
        code: 'ad',
        name: {
            en: 'Andorra',
            ru: 'Андорра',
            uz_lat: 'Andorra',
            uz_cyr: 'Андорра'
        }
    },
    {
        code: 'ao',
        name: {
            en: 'Angola',
            ru: 'Ангола',
            uz_lat: 'Angola',
            uz_cyr: 'Ангола'
        }
    },
    {
        code: 'ag',
        name: {
            en: 'Antigua and Barbuda',
            ru: 'Антигуа и Барбуда',
            uz_lat: 'Antigua va Barbuda',
            uz_cyr: 'Антигуа ва Барбуда'
        }
    },
    {
        code: 'ar',
        name: {
            en: 'Argentina',
            ru: 'Аргентина',
            uz_lat: 'Argentina',
            uz_cyr: 'Аргентина'
        }
    },
    {
        code: 'am',
        name: {
            en: 'Armenia',
            ru: 'Армения',
            uz_lat: 'Armaniston',
            uz_cyr: 'Арманистон'
        }
    },
    {
        code: 'au',
        name: {
            en: 'Australia',
            ru: 'Австралия',
            uz_lat: 'Avstraliya',
            uz_cyr: 'Австралия'
        }
    },
    {
        code: 'at',
        name: {
            en: 'Austria',
            ru: 'Австрия',
            uz_lat: 'Avstriya',
            uz_cyr: 'Австрия'
        }
    },
    {
        code: 'az',
        name: {
            en: 'Azerbaijan',
            ru: 'Азербайджан',
            uz_lat: 'Ozarbayjon',
            uz_cyr: 'Озарбайжон'
        }
    },
    {
        code: 'bs',
        name: {
            en: 'Bahamas',
            ru: 'Багамы',
            uz_lat: 'Bagama orollari',
            uz_cyr: 'Багама ороллари'
        }
    },
    {
        code: 'bh',
        name: {
            en: 'Bahrain',
            ru: 'Бахрейн',
            uz_lat: 'Bahrayn',
            uz_cyr: 'Баҳрайн'
        }
    },
    {
        code: 'bd',
        name: {
            en: 'Bangladesh',
            ru: 'Бангладеш',
            uz_lat: 'Bangladesh',
            uz_cyr: 'Бангладеш'
        }
    },
    {
        code: 'bb',
        name: {
            en: 'Barbados',
            ru: 'Барбадос',
            uz_lat: 'Barbados',
            uz_cyr: 'Барбадос'
        }
    },
    {
        code: 'by',
        name: {
            en: 'Belarus',
            ru: 'Беларусь',
            uz_lat: 'Belarus',
            uz_cyr: 'Беларус'
        }
    },
    {
        code: 'be',
        name: {
            en: 'Belgium',
            ru: 'Бельгия',
            uz_lat: 'Belgiya',
            uz_cyr: 'Бельгия'
        }
    },
    {
        code: 'bz',
        name: {
            en: 'Belize',
            ru: 'Белиз',
            uz_lat: 'Beliz',
            uz_cyr: 'Белиз'
        }
    },
    {
        code: 'bj',
        name: {
            en: 'Benin',
            ru: 'Бенин',
            uz_lat: 'Benin',
            uz_cyr: 'Бенин'
        }
    },
    {
        code: 'bt',
        name: {
            en: 'Bhutan',
            ru: 'Бутан',
            uz_lat: 'Butan',
            uz_cyr: 'Бутан'
        }
    },
    {
        code: 'bo',
        name: {
            en: 'Bolivia',
            ru: 'Боливия',
            uz_lat: 'Boliviya',
            uz_cyr: 'Боливия'
        }
    },
    {
        code: 'ba',
        name: {
            en: 'Bosnia and Herzegovina',
            ru: 'Босния и Герцеговина',
            uz_lat: 'Bosniya va Gertsegovina',
            uz_cyr: 'Босния ва Герцеговина'
        }
    },
    {
        code: 'bw',
        name: {
            en: 'Botswana',
            ru: 'Ботсвана',
            uz_lat: 'Botsvana',
            uz_cyr: 'Ботсвана'
        }
    },
    {
        code: 'br',
        name: {
            en: 'Brazil',
            ru: 'Бразилия',
            uz_lat: 'Braziliya',
            uz_cyr: 'Бразилия'
        }
    },
    {
        code: 'bn',
        name: {
            en: 'Brunei',
            ru: 'Бруней',
            uz_lat: 'Bruney',
            uz_cyr: 'Бруней'
        }
    },
    {
        code: 'bg',
        name: {
            en: 'Bulgaria',
            ru: 'Болгария',
            uz_lat: 'Bolgariya',
            uz_cyr: 'Болгария'
        }
    },
    {
        code: 'bf',
        name: {
            en: 'Burkina Faso',
            ru: 'Буркина-Фасо',
            uz_lat: 'Burkina-Faso',
            uz_cyr: 'Буркина-Фасо'
        }
    },
    {
        code: 'bi',
        name: {
            en: 'Burundi',
            ru: 'Бурунди',
            uz_lat: 'Burundi',
            uz_cyr: 'Бурунди'
        }
    },
    {
        code: 'cv',
        name: {
            en: 'Cabo Verde',
            ru: 'Кабо-Верде',
            uz_lat: 'Kabo-Verde',
            uz_cyr: 'Кабо-Верде'
        }
    },
    {
        code: 'kh',
        name: {
            en: 'Cambodia',
            ru: 'Камбоджа',
            uz_lat: 'Kambodja',
            uz_cyr: 'Камбожа'
        }
    },
    {
        code: 'cm',
        name: {
            en: 'Cameroon',
            ru: 'Камерун',
            uz_lat: 'Kamerun',
            uz_cyr: 'Камерун'
        }
    },
    {
        code: 'ca',
        name: {
            en: 'Canada',
            ru: 'Канада',
            uz_lat: 'Kanada',
            uz_cyr: 'Канада'
        }
    },
    {
        code: 'cf',
        name: {
            en: 'Central African Republic',
            ru: 'Центральноафриканская Республика',
            uz_lat: 'Markaziy Afrika Respublikasi',
            uz_cyr: 'Марказий Африка Республикаси'
        }
    },
    {
        code: 'td',
        name: {
            en: 'Chad',
            ru: 'Чад',
            uz_lat: 'Chad',
            uz_cyr: 'Чад'
        }
    },
    {
        code: 'cl',
        name: {
            en: 'Chile',
            ru: 'Чили',
            uz_lat: 'Chili',
            uz_cyr: 'Чили'
        }
    },
    {
        code: 'cn',
        name: {
            en: 'China',
            ru: 'Китай',
            uz_lat: 'Xitoy',
            uz_cyr: 'Хитой'
        },
        isPermanentMember: true,
        hasVetoRight: true
    },
    {
        code: 'co',
        name: {
            en: 'Colombia',
            ru: 'Колумбия',
            uz_lat: 'Kolumbiya',
            uz_cyr: 'Колумбия'
        }
    },
    {
        code: 'km',
        name: {
            en: 'Comoros',
            ru: 'Коморы',
            uz_lat: 'Komor orollari',
            uz_cyr: 'Комор ороллари'
        }
    },
    {
        code: 'cg',
        name: {
            en: 'Congo',
            ru: 'Республика Конго',
            uz_lat: 'Kongo Respublikasi',
            uz_cyr: 'Конго Республикаси'
        }
    },
    {
        code: 'cr',
        name: {
            en: 'Costa Rica',
            ru: 'Коста-Рика',
            uz_lat: 'Kosta-Rika',
            uz_cyr: 'Коста-Рика'
        }
    },
    {
        code: 'hr',
        name: {
            en: 'Croatia',
            ru: 'Хорватия',
            uz_lat: 'Xorvatiya',
            uz_cyr: 'Хорватия'
        }
    },
    {
        code: 'cu',
        name: {
            en: 'Cuba',
            ru: 'Куба',
            uz_lat: 'Kuba',
            uz_cyr: 'Куба'
        }
    },
    {
        code: 'cy',
        name: {
            en: 'Cyprus',
            ru: 'Кипр',
            uz_lat: 'Kipr',
            uz_cyr: 'Кипр'
        }
    },
    {
        code: 'cz',
        name: {
            en: 'Czech Republic',
            ru: 'Чехия',
            uz_lat: 'Chexiya',
            uz_cyr: 'Чехия'
        }
    },
    {
        code: 'cd',
        name: {
            en: 'Democratic Republic of the Congo',
            ru: 'Демократическая Республика Конго',
            uz_lat: 'Kongo Demokratik Respublikasi',
            uz_cyr: 'Конго Демократик Республикаси'
        }
    },
    {
        code: 'dk',
        name: {
            en: 'Denmark',
            ru: 'Дания',
            uz_lat: 'Daniya',
            uz_cyr: 'Дания'
        }
    },
    {
        code: 'dj',
        name: {
            en: 'Djibouti',
            ru: 'Джибути',
            uz_lat: 'Jibuti',
            uz_cyr: 'Жибути'
        }
    },
    {
        code: 'dm',
        name: {
            en: 'Dominica',
            ru: 'Доминика',
            uz_lat: 'Dominika',
            uz_cyr: 'Доминика'
        }
    },
    {
        code: 'do',
        name: {
            en: 'Dominican Republic',
            ru: 'Доминиканская Республика',
            uz_lat: 'Dominikan Respublikasi',
            uz_cyr: 'Доминикан Республикаси'
        }
    },
    {
        code: 'ec',
        name: {
            en: 'Ecuador',
            ru: 'Эквадор',
            uz_lat: 'Ekvador',
            uz_cyr: 'Эквадор'
        }
    },
    {
        code: 'eg',
        name: {
            en: 'Egypt',
            ru: 'Египет',
            uz_lat: 'Misr',
            uz_cyr: 'Миср'
        }
    },
    {
        code: 'sv',
        name: {
            en: 'El Salvador',
            ru: 'Сальвадор',
            uz_lat: 'Salvador',
            uz_cyr: 'Салвадор'
        }
    },
    {
        code: 'gq',
        name: {
            en: 'Equatorial Guinea',
            ru: 'Экваториальная Гвинея',
            uz_lat: 'Ekvatorial Gvineya',
            uz_cyr: 'Экваториал Гвинея'
        }
    },
    {
        code: 'er',
        name: {
            en: 'Eritrea',
            ru: 'Эритрея',
            uz_lat: 'Eritreya',
            uz_cyr: 'Эритрея'
        }
    },
    {
        code: 'ee',
        name: {
            en: 'Estonia',
            ru: 'Эстония',
            uz_lat: 'Estoniya',
            uz_cyr: 'Эстония'
        }
    },
    {
        code: 'sz',
        name: {
            en: 'Eswatini',
            ru: 'Эсватини',
            uz_lat: 'Esvatini',
            uz_cyr: 'Эсватини'
        }
    },
    {
        code: 'et',
        name: {
            en: 'Ethiopia',
            ru: 'Эфиопия',
            uz_lat: 'Efiopiya',
            uz_cyr: 'Эфиопия'
        }
    },
    {
        code: 'fj',
        name: {
            en: 'Fiji',
            ru: 'Фиджи',
            uz_lat: 'Fiji',
            uz_cyr: 'Фижи'
        }
    },
    {
        code: 'fi',
        name: {
            en: 'Finland',
            ru: 'Финляндия',
            uz_lat: 'Finlandiya',
            uz_cyr: 'Финландия'
        }
    },
    {
        code: 'fr',
        name: {
            en: 'France',
            ru: 'Франция',
            uz_lat: 'Fransiya',
            uz_cyr: 'Франсия'
        },
        isPermanentMember: true,
        hasVetoRight: true
    },
    {
        code: 'ga',
        name: {
            en: 'Gabon',
            ru: 'Габон',
            uz_lat: 'Gabon',
            uz_cyr: 'Габон'
        }
    },
    {
        code: 'gm',
        name: {
            en: 'Gambia',
            ru: 'Гамбия',
            uz_lat: 'Gambiya',
            uz_cyr: 'Гамбия'
        }
    },
    {
        code: 'ge',
        name: {
            en: 'Georgia',
            ru: 'Грузия',
            uz_lat: 'Gruziya',
            uz_cyr: 'Грузия'
        }
    },
    {
        code: 'de',
        name: {
            en: 'Germany',
            ru: 'Германия',
            uz_lat: 'Germaniya',
            uz_cyr: 'Германия'
        }
    },
    {
        code: 'gh',
        name: {
            en: 'Ghana',
            ru: 'Гана',
            uz_lat: 'Gana',
            uz_cyr: 'Гана'
        }
    },
    {
        code: 'gr',
        name: {
            en: 'Greece',
            ru: 'Греция',
            uz_lat: 'Gretsiya',
            uz_cyr: 'Греция'
        }
    },
    {
        code: 'gd',
        name: {
            en: 'Grenada',
            ru: 'Гренада',
            uz_lat: 'Grenada',
            uz_cyr: 'Гренада'
        }
    },
    {
        code: 'gt',
        name: {
            en: 'Guatemala',
            ru: 'Гватемала',
            uz_lat: 'Gvatemala',
            uz_cyr: 'Гватемала'
        }
    },
    {
        code: 'gn',
        name: {
            en: 'Guinea',
            ru: 'Гвинея',
            uz_lat: 'Gvineya',
            uz_cyr: 'Гвинея'
        }
    },
    {
        code: 'gw',
        name: {
            en: 'Guinea-Bissau',
            ru: 'Гвинея-Бисау',
            uz_lat: 'Gvineya-Bisau',
            uz_cyr: 'Гвинея-Бисау'
        }
    },
    {
        code: 'gy',
        name: {
            en: 'Guyana',
            ru: 'Гайана',
            uz_lat: 'Gayana',
            uz_cyr: 'Гаяна'
        }
    },
    {
        code: 'ht',
        name: {
            en: 'Haiti',
            ru: 'Гаити',
            uz_lat: 'Gaiti',
            uz_cyr: 'Гаити'
        }
    },
    {
        code: 'hn',
        name: {
            en: 'Honduras',
            ru: 'Гондурас',
            uz_lat: 'Gonduras',
            uz_cyr: 'Гондурас'
        }
    },
    {
        code: 'hu',
        name: {
            en: 'Hungary',
            ru: 'Венгрия',
            uz_lat: 'Vengriya',
            uz_cyr: 'Венгрия'
        }
    },
    {
        code: 'is',
        name: {
            en: 'Iceland',
            ru: 'Исландия',
            uz_lat: 'Islandiya',
            uz_cyr: 'Исландия'
        }
    },
    {
        code: 'in',
        name: {
            en: 'India',
            ru: 'Индия',
            uz_lat: 'Hindiston',
            uz_cyr: 'Ҳиндистон'
        }
    },
    {
        code: 'id',
        name: {
            en: 'Indonesia',
            ru: 'Индонезия',
            uz_lat: 'Indoneziya',
            uz_cyr: 'Индонезия'
        }
    },
    {
        code: 'ir',
        name: {
            en: 'Iran',
            ru: 'Иран',
            uz_lat: 'Eron',
            uz_cyr: 'Эрон'
        }
    },
    {
        code: 'iq',
        name: {
            en: 'Iraq',
            ru: 'Ирак',
            uz_lat: 'Iroq',
            uz_cyr: 'Ироқ'
        }
    },
    {
        code: 'ie',
        name: {
            en: 'Ireland',
            ru: 'Ирландия',
            uz_lat: 'Irlandiya',
            uz_cyr: 'Ирландия'
        }
    },
    {
        code: 'il',
        name: {
            en: 'Israel',
            ru: 'Израиль',
            uz_lat: 'Isroil',
            uz_cyr: 'Исроил'
        }
    },
    {
        code: 'it',
        name: {
            en: 'Italy',
            ru: 'Италия',
            uz_lat: 'Italiya',
            uz_cyr: 'Италия'
        }
    },
    {
        code: 'ci',
        name: {
            en: 'Ivory Coast',
            ru: 'Кот-д\'Ивуар',
            uz_lat: 'Kot-d\'Ivuar',
            uz_cyr: 'Кот-д\'Ивуар'
        }
    },
    {
        code: 'jm',
        name: {
            en: 'Jamaica',
            ru: 'Ямайка',
            uz_lat: 'Yamayka',
            uz_cyr: 'Ямайка'
        }
    },
    {
        code: 'jp',
        name: {
            en: 'Japan',
            ru: 'Япония',
            uz_lat: 'Yaponiya',
            uz_cyr: 'Япония'
        }
    },
    {
        code: 'jo',
        name: {
            en: 'Jordan',
            ru: 'Иордания',
            uz_lat: 'Iordaniya',
            uz_cyr: 'Иордания'
        }
    },
    {
        code: 'kz',
        name: {
            en: 'Kazakhstan',
            ru: 'Казахстан',
            uz_lat: 'Qozog\'iston',
            uz_cyr: 'Қозоғистон'
        }
    },
    {
        code: 'ke',
        name: {
            en: 'Kenya',
            ru: 'Кения',
            uz_lat: 'Keniya',
            uz_cyr: 'Кения'
        }
    },
    {
        code: 'ki',
        name: {
            en: 'Kiribati',
            ru: 'Кирибати',
            uz_lat: 'Kiribati',
            uz_cyr: 'Кирибати'
        }
    },
    {
        code: 'kw',
        name: {
            en: 'Kuwait',
            ru: 'Кувейт',
            uz_lat: 'Quvayt',
            uz_cyr: 'Қувайт'
        }
    },
    {
        code: 'kg',
        name: {
            en: 'Kyrgyzstan',
            ru: 'Кыргызстан',
            uz_lat: 'Qirg\'iziston',
            uz_cyr: 'Қирғизистон'
        }
    },
    {
        code: 'la',
        name: {
            en: 'Laos',
            ru: 'Лаос',
            uz_lat: 'Laos',
            uz_cyr: 'Лаос'
        }
    },
    {
        code: 'lv',
        name: {
            en: 'Latvia',
            ru: 'Латвия',
            uz_lat: 'Latviya',
            uz_cyr: 'Латвия'
        }
    },
    {
        code: 'lb',
        name: {
            en: 'Lebanon',
            ru: 'Ливан',
            uz_lat: 'Livan',
            uz_cyr: 'Ливан'
        }
    },
    {
        code: 'ls',
        name: {
            en: 'Lesotho',
            ru: 'Лесото',
            uz_lat: 'Lesoto',
            uz_cyr: 'Лесото'
        }
    },
    {
        code: 'lr',
        name: {
            en: 'Liberia',
            ru: 'Либерия',
            uz_lat: 'Liberiya',
            uz_cyr: 'Либерия'
        }
    },
    {
        code: 'ly',
        name: {
            en: 'Libya',
            ru: 'Ливия',
            uz_lat: 'Liviya',
            uz_cyr: 'Ливия'
        }
    },
    {
        code: 'li',
        name: {
            en: 'Liechtenstein',
            ru: 'Лихтенштейн',
            uz_lat: 'Lixtenshteyn',
            uz_cyr: 'Лихтенштейн'
        }
    },
    {
        code: 'lt',
        name: {
            en: 'Lithuania',
            ru: 'Литва',
            uz_lat: 'Litva',
            uz_cyr: 'Литва'
        }
    },
    {
        code: 'lu',
        name: {
            en: 'Luxembourg',
            ru: 'Люксембург',
            uz_lat: 'Lyuksemburg',
            uz_cyr: 'Люксембург'
        }
    },
    {
        code: 'mg',
        name: {
            en: 'Madagascar',
            ru: 'Мадагаскар',
            uz_lat: 'Madagaskar',
            uz_cyr: 'Мадагаскар'
        }
    },
    {
        code: 'mw',
        name: {
            en: 'Malawi',
            ru: 'Малави',
            uz_lat: 'Malavi',
            uz_cyr: 'Малави'
        }
    },
    {
        code: 'my',
        name: {
            en: 'Malaysia',
            ru: 'Малайзия',
            uz_lat: 'Malayziya',
            uz_cyr: 'Малайзия'
        }
    },
    {
        code: 'mv',
        name: {
            en: 'Maldives',
            ru: 'Мальдивы',
            uz_lat: 'Maldiv orollari',
            uz_cyr: 'Малдив ороллари'
        }
    },
    {
        code: 'ml',
        name: {
            en: 'Mali',
            ru: 'Мали',
            uz_lat: 'Mali',
            uz_cyr: 'Мали'
        }
    },
    {
        code: 'mt',
        name: {
            en: 'Malta',
            ru: 'Мальта',
            uz_lat: 'Malta',
            uz_cyr: 'Малта'
        }
    },
    {
        code: 'mh',
        name: {
            en: 'Marshall Islands',
            ru: 'Маршалловы Острова',
            uz_lat: 'Marshall orollari',
            uz_cyr: 'Маршалл ороллари'
        }
    },
    {
        code: 'mr',
        name: {
            en: 'Mauritania',
            ru: 'Мавритания',
            uz_lat: 'Mavritaniya',
            uz_cyr: 'Мавритания'
        }
    },
    {
        code: 'mu',
        name: {
            en: 'Mauritius',
            ru: 'Маврикий',
            uz_lat: 'Mavrikiy',
            uz_cyr: 'Маврикий'
        }
    },
    {
        code: 'mx',
        name: {
            en: 'Mexico',
            ru: 'Мексика',
            uz_lat: 'Meksika',
            uz_cyr: 'Мексика'
        }
    },
    {
        code: 'fm',
        name: {
            en: 'Micronesia',
            ru: 'Микронезия',
            uz_lat: 'Mikroneziya',
            uz_cyr: 'Микронезия'
        }
    },
    {
        code: 'md',
        name: {
            en: 'Moldova',
            ru: 'Молдова',
            uz_lat: 'Moldova',
            uz_cyr: 'Молдова'
        }
    },
    {
        code: 'mc',
        name: {
            en: 'Monaco',
            ru: 'Монако',
            uz_lat: 'Monako',
            uz_cyr: 'Монако'
        }
    },
    {
        code: 'mn',
        name: {
            en: 'Mongolia',
            ru: 'Монголия',
            uz_lat: 'Mo\'g\'uliston',
            uz_cyr: 'Мўғулистон'
        }
    },
    {
        code: 'me',
        name: {
            en: 'Montenegro',
            ru: 'Черногория',
            uz_lat: 'Chernogoriya',
            uz_cyr: 'Черногория'
        }
    },
    {
        code: 'ma',
        name: {
            en: 'Morocco',
            ru: 'Марокко',
            uz_lat: 'Marokash',
            uz_cyr: 'Марокаш'
        }
    },
    {
        code: 'mz',
        name: {
            en: 'Mozambique',
            ru: 'Мозамбик',
            uz_lat: 'Mozambik',
            uz_cyr: 'Мозамбик'
        }
    },
    {
        code: 'mm',
        name: {
            en: 'Myanmar',
            ru: 'Мьянма',
            uz_lat: 'Myanma',
            uz_cyr: 'Мянма'
        }
    },
    {
        code: 'na',
        name: {
            en: 'Namibia',
            ru: 'Намибия',
            uz_lat: 'Namibiya',
            uz_cyr: 'Намибия'
        }
    },
    {
        code: 'nr',
        name: {
            en: 'Nauru',
            ru: 'Науру',
            uz_lat: 'Nauru',
            uz_cyr: 'Науру'
        }
    },
    {
        code: 'np',
        name: {
            en: 'Nepal',
            ru: 'Непал',
            uz_lat: 'Nepal',
            uz_cyr: 'Непал'
        }
    },
    {
        code: 'nl',
        name: {
            en: 'Netherlands',
            ru: 'Нидерланды',
            uz_lat: 'Niderlandiya',
            uz_cyr: 'Нидерландия'
        }
    },
    {
        code: 'nz',
        name: {
            en: 'New Zealand',
            ru: 'Новая Зеландия',
            uz_lat: 'Yangi Zelandiya',
            uz_cyr: 'Янги Зеландия'
        }
    },
    {
        code: 'ni',
        name: {
            en: 'Nicaragua',
            ru: 'Никарагуа',
            uz_lat: 'Nikaragua',
            uz_cyr: 'Никарагуа'
        }
    },
    {
        code: 'ne',
        name: {
            en: 'Niger',
            ru: 'Нигер',
            uz_lat: 'Niger',
            uz_cyr: 'Нигер'
        }
    },
    {
        code: 'ng',
        name: {
            en: 'Nigeria',
            ru: 'Нигерия',
            uz_lat: 'Nigeriya',
            uz_cyr: 'Нигерия'
        }
    },
    {
        code: 'kp',
        name: {
            en: 'North Korea',
            ru: 'Северная Корея',
            uz_lat: 'Shimoliy Koreya',
            uz_cyr: 'Шимолий Корея'
        }
    },
    {
        code: 'mk',
        name: {
            en: 'North Macedonia',
            ru: 'Северная Македония',
            uz_lat: 'Shimoliy Makedoniya',
            uz_cyr: 'Шимолий Македония'
        }
    },
    {
        code: 'no',
        name: {
            en: 'Norway',
            ru: 'Норвегия',
            uz_lat: 'Norvegiya',
            uz_cyr: 'Норвегия'
        }
    },
    {
        code: 'om',
        name: {
            en: 'Oman',
            ru: 'Оман',
            uz_lat: 'Ummon',
            uz_cyr: 'Уммон'
        }
    },
    {
        code: 'pk',
        name: {
            en: 'Pakistan',
            ru: 'Пакистан',
            uz_lat: 'Pokiston',
            uz_cyr: 'Покистон'
        }
    },
    {
        code: 'pw',
        name: {
            en: 'Palau',
            ru: 'Палау',
            uz_lat: 'Palau',
            uz_cyr: 'Палау'
        }
    },
    {
        code: 'pa',
        name: {
            en: 'Panama',
            ru: 'Панама',
            uz_lat: 'Panama',
            uz_cyr: 'Панама'
        }
    },
    {
        code: 'pg',
        name: {
            en: 'Papua New Guinea',
            ru: 'Папуа-Новая Гвинея',
            uz_lat: 'Papua-Yangi Gvineya',
            uz_cyr: 'Папуа-Янги Гвинея'
        }
    },
    {
        code: 'py',
        name: {
            en: 'Paraguay',
            ru: 'Парагвай',
            uz_lat: 'Paragvay',
            uz_cyr: 'Парагвай'
        }
    },
    {
        code: 'pe',
        name: {
            en: 'Peru',
            ru: 'Перу',
            uz_lat: 'Peru',
            uz_cyr: 'Перу'
        }
    },
    {
        code: 'ph',
        name: {
            en: 'Philippines',
            ru: 'Филиппины',
            uz_lat: 'Filippin',
            uz_cyr: 'Филиппин'
        }
    },
    {
        code: 'pl',
        name: {
            en: 'Poland',
            ru: 'Польша',
            uz_lat: 'Polsha',
            uz_cyr: 'Полша'
        }
    },
    {
        code: 'pt',
        name: {
            en: 'Portugal',
            ru: 'Португалия',
            uz_lat: 'Portugaliya',
            uz_cyr: 'Португалия'
        }
    },
    {
        code: 'qa',
        name: {
            en: 'Qatar',
            ru: 'Катар',
            uz_lat: 'Qatar',
            uz_cyr: 'Қатар'
        }
    },
    {
        code: 'ro',
        name: {
            en: 'Romania',
            ru: 'Румыния',
            uz_lat: 'Ruminiya',
            uz_cyr: 'Руминия'
        }
    },
    {
        code: 'ru',
        name: {
            en: 'Russia',
            ru: 'Россия',
            uz_lat: 'Rossiya',
            uz_cyr: 'Россия'
        },
        isPermanentMember: true,
        hasVetoRight: true
    },
    {
        code: 'rw',
        name: {
            en: 'Rwanda',
            ru: 'Руанда',
            uz_lat: 'Ruanda',
            uz_cyr: 'Руанда'
        }
    },
    {
        code: 'kn',
        name: {
            en: 'Saint Kitts and Nevis',
            ru: 'Сент-Китс и Невис',
            uz_lat: 'Sent-Kits va Nevis',
            uz_cyr: 'Сент-Китс ва Невис'
        }
    },
    {
        code: 'lc',
        name: {
            en: 'Saint Lucia',
            ru: 'Сент-Люсия',
            uz_lat: 'Sent-Lyusiya',
            uz_cyr: 'Сент-Люсия'
        }
    },
    {
        code: 'vc',
        name: {
            en: 'Saint Vincent and the Grenadines',
            ru: 'Сент-Винсент и Гренадины',
            uz_lat: 'Sent-Vinsent va Grenadinlar',
            uz_cyr: 'Сент-Винсент ва Гренадинлар'
        }
    },
    {
        code: 'ws',
        name: {
            en: 'Samoa',
            ru: 'Самоа',
            uz_lat: 'Samoa',
            uz_cyr: 'Самоа'
        }
    },
    {
        code: 'sm',
        name: {
            en: 'San Marino',
            ru: 'Сан-Марино',
            uz_lat: 'San-Marino',
            uz_cyr: 'Сан-Марино'
        }
    },
    {
        code: 'st',
        name: {
            en: 'Sao Tome and Principe',
            ru: 'Сан-Томе и Принсипи',
            uz_lat: 'San-Tome va Prinsipi',
            uz_cyr: 'Сан-Томе ва Принсипи'
        }
    },
    {
        code: 'sa',
        name: {
            en: 'Saudi Arabia',
            ru: 'Саудовская Аравия',
            uz_lat: 'Saudiya Arabistoni',
            uz_cyr: 'Саудия Арабистони'
        }
    },
    {
        code: 'sn',
        name: {
            en: 'Senegal',
            ru: 'Сенегал',
            uz_lat: 'Senegal',
            uz_cyr: 'Сенегал'
        }
    },
    {
        code: 'rs',
        name: {
            en: 'Serbia',
            ru: 'Сербия',
            uz_lat: 'Serbiya',
            uz_cyr: 'Сербия'
        }
    },
    {
        code: 'sc',
        name: {
            en: 'Seychelles',
            ru: 'Сейшелы',
            uz_lat: 'Seyshel orollari',
            uz_cyr: 'Сейшел ороллари'
        }
    },
    {
        code: 'sl',
        name: {
            en: 'Sierra Leone',
            ru: 'Сьерра-Леоне',
            uz_lat: 'Syerra-Leone',
            uz_cyr: 'Сьерра-Леоне'
        }
    },
    {
        code: 'sg',
        name: {
            en: 'Singapore',
            ru: 'Сингапур',
            uz_lat: 'Singapur',
            uz_cyr: 'Сингапур'
        }
    },
    {
        code: 'sk',
        name: {
            en: 'Slovakia',
            ru: 'Словакия',
            uz_lat: 'Slovakiya',
            uz_cyr: 'Словакия'
        }
    },
    {
        code: 'si',
        name: {
            en: 'Slovenia',
            ru: 'Словения',
            uz_lat: 'Sloveniya',
            uz_cyr: 'Словения'
        }
    },
    {
        code: 'sb',
        name: {
            en: 'Solomon Islands',
            ru: 'Соломоновы Острова',
            uz_lat: 'Solomon orollari',
            uz_cyr: 'Соломон ороллари'
        }
    },
    {
        code: 'so',
        name: {
            en: 'Somalia',
            ru: 'Сомали',
            uz_lat: 'Somali',
            uz_cyr: 'Сомали'
        }
    },
    {
        code: 'za',
        name: {
            en: 'South Africa',
            ru: 'Южная Африка',
            uz_lat: 'Janubiy Afrika',
            uz_cyr: 'Жанубий Африка'
        }
    },
    {
        code: 'kr',
        name: {
            en: 'South Korea',
            ru: 'Южная Корея',
            uz_lat: 'Janubiy Koreya',
            uz_cyr: 'Жанубий Корея'
        }
    },
    {
        code: 'ss',
        name: {
            en: 'South Sudan',
            ru: 'Южный Судан',
            uz_lat: 'Janubiy Sudan',
            uz_cyr: 'Жанубий Судан'
        }
    },
    {
        code: 'es',
        name: {
            en: 'Spain',
            ru: 'Испания',
            uz_lat: 'Ispaniya',
            uz_cyr: 'Испания'
        }
    },
    {
        code: 'lk',
        name: {
            en: 'Sri Lanka',
            ru: 'Шри-Ланка',
            uz_lat: 'Shri-Lanka',
            uz_cyr: 'Шри-Ланка'
        }
    },
    {
        code: 'sd',
        name: {
            en: 'Sudan',
            ru: 'Судан',
            uz_lat: 'Sudan',
            uz_cyr: 'Судан'
        }
    },
    {
        code: 'sr',
        name: {
            en: 'Suriname',
            ru: 'Суринам',
            uz_lat: 'Surinam',
            uz_cyr: 'Суринам'
        }
    },
    {
        code: 'se',
        name: {
            en: 'Sweden',
            ru: 'Швеция',
            uz_lat: 'Shvetsiya',
            uz_cyr: 'Швеция'
        }
    },
    {
        code: 'ch',
        name: {
            en: 'Switzerland',
            ru: 'Швейцария',
            uz_lat: 'Shveytsariya',
            uz_cyr: 'Швейцария'
        }
    },
    {
        code: 'sy',
        name: {
            en: 'Syria',
            ru: 'Сирия',
            uz_lat: 'Suriya',
            uz_cyr: 'Сурия'
        }
    },
    {
        code: 'tj',
        name: {
            en: 'Tajikistan',
            ru: 'Таджикистан',
            uz_lat: 'Tojikiston',
            uz_cyr: 'Тожикистон'
        }
    },
    {
        code: 'tz',
        name: {
            en: 'Tanzania',
            ru: 'Танзания',
            uz_lat: 'Tanzaniya',
            uz_cyr: 'Танзания'
        }
    },
    {
        code: 'th',
        name: {
            en: 'Thailand',
            ru: 'Таиланд',
            uz_lat: 'Tailand',
            uz_cyr: 'Таиланд'
        }
    },
    {
        code: 'tl',
        name: {
            en: 'Timor-Leste',
            ru: 'Восточный Тимор',
            uz_lat: 'Sharqiy Timor',
            uz_cyr: 'Шарқий Тимор'
        }
    },
    {
        code: 'tg',
        name: {
            en: 'Togo',
            ru: 'Того',
            uz_lat: 'Togo',
            uz_cyr: 'Того'
        }
    },
    {
        code: 'to',
        name: {
            en: 'Tonga',
            ru: 'Тонга',
            uz_lat: 'Tonga',
            uz_cyr: 'Тонга'
        }
    },
    {
        code: 'tt',
        name: {
            en: 'Trinidad and Tobago',
            ru: 'Тринидад и Тобаго',
            uz_lat: 'Trinidad va Tobago',
            uz_cyr: 'Тринидад ва Тобаго'
        }
    },
    {
        code: 'tn',
        name: {
            en: 'Tunisia',
            ru: 'Тунис',
            uz_lat: 'Tunis',
            uz_cyr: 'Тунис'
        }
    },
    {
        code: 'tr',
        name: {
            en: 'Turkey',
            ru: 'Турция',
            uz_lat: 'Turkiya',
            uz_cyr: 'Туркия'
        }
    },
    {
        code: 'tm',
        name: {
            en: 'Turkmenistan',
            ru: 'Туркменистан',
            uz_lat: 'Turkmaniston',
            uz_cyr: 'Туркманистон'
        }
    },
    {
        code: 'tv',
        name: {
            en: 'Tuvalu',
            ru: 'Тувалу',
            uz_lat: 'Tuvalu',
            uz_cyr: 'Тувалу'
        }
    },
    {
        code: 'ug',
        name: {
            en: 'Uganda',
            ru: 'Уганда',
            uz_lat: 'Uganda',
            uz_cyr: 'Уганда'
        }
    },
    {
        code: 'ua',
        name: {
            en: 'Ukraine',
            ru: 'Украина',
            uz_lat: 'Ukraina',
            uz_cyr: 'Украина'
        }
    },
    {
        code: 'ae',
        name: {
            en: 'United Arab Emirates',
            ru: 'ОАЭ',
            uz_lat: 'Birlashgan Arab Amirliklari',
            uz_cyr: 'Бирлашган Араб Амирликлари'
        }
    },
    {
        code: 'gb',
        name: {
            en: 'United Kingdom',
            ru: 'Великобритания',
            uz_lat: 'Buyuk Britaniya',
            uz_cyr: 'Буюк Британия'
        },
        isPermanentMember: true,
        hasVetoRight: true
    },
    {
        code: 'us',
        name: {
            en: 'United States',
            ru: 'США',
            uz_lat: 'AQSH',
            uz_cyr: 'АҚШ'
        },
        isPermanentMember: true,
        hasVetoRight: true
    },
    {
        code: 'uy',
        name: {
            en: 'Uruguay',
            ru: 'Уругвай',
            uz_lat: 'Urugvay',
            uz_cyr: 'Уругвай'
        }
    },
    {
        code: 'uz',
        name: {
            en: 'Uzbekistan',
            ru: 'Узбекистан',
            uz_lat: 'O\'zbekiston',
            uz_cyr: 'Ўзбекистон'
        }
    },
    {
        code: 'vu',
        name: {
            en: 'Vanuatu',
            ru: 'Вануату',
            uz_lat: 'Vanuatu',
            uz_cyr: 'Вануату'
        }
    },
    {
        code: 've',
        name: {
            en: 'Venezuela',
            ru: 'Венесуэла',
            uz_lat: 'Venesuela',
            uz_cyr: 'Венесуэла'
        }
    },
    {
        code: 'vn',
        name: {
            en: 'Vietnam',
            ru: 'Вьетнам',
            uz_lat: 'Vyetnam',
            uz_cyr: 'Вьетнам'
        }
    },
    {
        code: 'ye',
        name: {
            en: 'Yemen',
            ru: 'Йемен',
            uz_lat: 'Yaman',
            uz_cyr: 'Яман'
        }
    },
    {
        code: 'zm',
        name: {
            en: 'Zambia',
            ru: 'Замбия',
            uz_lat: 'Zambiya',
            uz_cyr: 'Замбия'
        }
    },
    {
        code: 'zw',
        name: {
            en: 'Zimbabwe',
            ru: 'Зимбабве',
            uz_lat: 'Zimbabve',
            uz_cyr: 'Зимбабве'
        }
    },

    // Observer States (2)
    {
        code: 'va',
        name: {
            en: 'Vatican City',
            ru: 'Ватикан',
            uz_lat: 'Vatikan',
            uz_cyr: 'Ватикан'
        },
        isObserver: true,
        specialRole: 'observer'
    },
    {
        code: 'ps',
        name: {
            en: 'Palestine',
            ru: 'Палестина',
            uz_lat: 'Falastin',
            uz_cyr: 'Фаластин'
        },
        isObserver: true,
        specialRole: 'observer'
    }
];

// Security Council Permanent Members (P5)
const SECURITY_COUNCIL_P5 = ['us', 'gb', 'fr', 'ru', 'cn'];

// Helper functions
const getAllCountries = (language = 'en') => {
    return UN_COUNTRIES.map(country => ({
        name: language === 'all' ? country.name : country.name[language] || country.name.en,
        code: country.code,
        flagUrl: `/api/countries/flags/${country.code}`,
        isPermanentMember: country.isPermanentMember || false,
        hasVetoRight: country.hasVetoRight || false,
        isObserver: country.isObserver || false,
        specialRole: country.specialRole || null
    }));
};

const getUNMembers = (language = 'en') => {
    return UN_COUNTRIES
        .filter(country => !country.isObserver)
        .map(country => ({
            name: language === 'all' ? country.name : country.name[language] || country.name.en,
            code: country.code,
            flagUrl: `/api/countries/flags/${country.code}`,
            isPermanentMember: country.isPermanentMember || false,
            hasVetoRight: country.hasVetoRight || false
        }));
};

const getObservers = (language = 'en') => {
    return UN_COUNTRIES
        .filter(country => country.isObserver)
        .map(country => ({
            name: language === 'all' ? country.name : country.name[language] || country.name.en,
            code: country.code,
            flagUrl: `/api/countries/flags/${country.code}`,
            isObserver: true,
            specialRole: country.specialRole
        }));
};

const getP5Countries = (language = 'en') => {
    return UN_COUNTRIES
        .filter(country => country.isPermanentMember)
        .map(country => ({
            name: language === 'all' ? country.name : country.name[language] || country.name.en,
            code: country.code,
            flagUrl: `/api/countries/flags/${country.code}`,
            isPermanentMember: true,
            hasVetoRight: true
        }));
};

const getCountryByName = (name, language = 'en') => {
    const country = UN_COUNTRIES.find(c => {
        if (language === 'all') {
            return Object.values(c.name).some(n => n.toLowerCase() === name.toLowerCase());
        }
        return c.name[language]?.toLowerCase() === name.toLowerCase() ||
            c.name.en.toLowerCase() === name.toLowerCase();
    });

    if (!country) return null;

    return {
        name: language === 'all' ? country.name : country.name[language] || country.name.en,
        code: country.code,
        flagUrl: `/api/countries/flags/${country.code}`,
        isPermanentMember: country.isPermanentMember || false,
        hasVetoRight: country.hasVetoRight || false,
        isObserver: country.isObserver || false,
        specialRole: country.specialRole || null
    };
};

const getCountryByCode = (code, language = 'en') => {
    const country = UN_COUNTRIES.find(c =>
        c.code.toLowerCase() === code.toLowerCase()
    );

    if (!country) return null;

    return {
        name: language === 'all' ? country.name : country.name[language] || country.name.en,
        code: country.code,
        flagUrl: `/api/countries/flags/${country.code}`,
        isPermanentMember: country.isPermanentMember || false,
        hasVetoRight: country.hasVetoRight || false,
        isObserver: country.isObserver || false,
        specialRole: country.specialRole || null
    };
};

module.exports = {
    UN_COUNTRIES,
    SECURITY_COUNCIL_P5,
    getAllCountries,
    getUNMembers,
    getObservers,
    getP5Countries,
    getCountryByName,
    getCountryByCode
};