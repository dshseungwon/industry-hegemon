// 자동 생성 스냅샷 — The Industry Brief 실데이터(KSF 가중치 + 실제 경쟁사).
// 출처: daily-industry-report/game_data.json (build/game_data.py가 리포트 HTML에서 추출).
// 갱신: 자매 레포에서 game_data.py 재실행 후 이 파일 재생성.
import { Cap } from "./state";
export interface GameData {
  gics: string; industry_en: string; industry_ko: string; sector: string;
  ksf_weights: Record<Cap, number>;
  global_company: string; korea_company: string;
  global_firms: { name: string; share: number }[];
}
export const GAME_DATA: Record<string, GameData> = {
  "101010": {
    "gics": "101010",
    "industry_en": "Energy Equipment & Services",
    "industry_ko": "에너지 장비 및 서비스",
    "sector": "Energy",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "SLB",
    "korea_company": "Hanwha Ocean (proxy)",
    "global_firms": [
      {
        "name": "SLB",
        "share": 12
      },
      {
        "name": "Baker Hughes",
        "share": 9
      },
      {
        "name": "Halliburton",
        "share": 7
      }
    ]
  },
  "101020": {
    "gics": "101020",
    "industry_en": "Oil, Gas & Consumable Fuels",
    "industry_ko": "석유·가스·소비연료",
    "sector": "Energy",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.125,
      "scale": 0.375,
      "global": 0.125
    },
    "global_company": "Saudi Aramco",
    "korea_company": "SK Innovation",
    "global_firms": [
      {
        "name": "United States미국",
        "share": 16
      },
      {
        "name": "Russia러시아",
        "share": 11.7
      },
      {
        "name": "Saudi Arabia사우디아라비아",
        "share": 11.3
      }
    ]
  },
  "151010": {
    "gics": "151010",
    "industry_en": "Chemicals",
    "industry_ko": "화학",
    "sector": "Materials",
    "ksf_weights": {
      "tech": 0.5,
      "brand": 0.214,
      "scale": 0.214,
      "global": 0.071
    },
    "global_company": "BASF SE",
    "korea_company": "LG Chem",
    "global_firms": [
      {
        "name": "BASF",
        "share": 29
      },
      {
        "name": "Dow",
        "share": 24
      },
      {
        "name": "Sinopec",
        "share": 18
      }
    ]
  },
  "151030": {
    "gics": "151030",
    "industry_en": "Containers & Packaging",
    "industry_ko": "용기·포장",
    "sector": "Materials",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.214,
      "scale": 0.357,
      "global": 0.214
    },
    "global_company": "Smurfit WestRock",
    "korea_company": "Dongwon Systems",
    "global_firms": [
      {
        "name": "Smurfit WestRock",
        "share": 36
      },
      {
        "name": "Amcor",
        "share": 25
      },
      {
        "name": "Ball",
        "share": 15
      }
    ]
  },
  "151040": {
    "gics": "151040",
    "industry_en": "Metals & Mining",
    "industry_ko": "금속·광업",
    "sector": "Materials",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "BHP Group",
    "korea_company": "Korea Zinc",
    "global_firms": [
      {
        "name": "Rio Tinto",
        "share": 22
      },
      {
        "name": "BHP",
        "share": 20
      },
      {
        "name": "Vale",
        "share": 15
      }
    ]
  },
  "151050": {
    "gics": "151050",
    "industry_en": "Paper & Forest Products",
    "industry_ko": "제지·임산물",
    "sector": "Materials",
    "ksf_weights": {
      "tech": 0.083,
      "brand": 0.417,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "Smurfit WestRock",
    "korea_company": "Hansol Paper",
    "global_firms": [
      {
        "name": "Smurfit WestRock",
        "share": 11
      },
      {
        "name": "International Paper",
        "share": 8
      },
      {
        "name": "Mondi",
        "share": 4
      }
    ]
  },
  "201010": {
    "gics": "201010",
    "industry_en": "Aerospace & Defense",
    "industry_ko": "항공우주·방위",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.125,
      "brand": 0.125,
      "scale": 0.375,
      "global": 0.375
    },
    "global_company": "Lockheed Martin",
    "korea_company": "Hanwha Aerospace",
    "global_firms": [
      {
        "name": "Lockheed Martin",
        "share": 34
      },
      {
        "name": "RTX",
        "share": 20
      },
      {
        "name": "Northrop Grumman",
        "share": 17
      }
    ]
  },
  "201020": {
    "gics": "201020",
    "industry_en": "Building Products",
    "industry_ko": "건축자재",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.357,
      "scale": 0.214,
      "global": 0.214
    },
    "global_company": "Saint-Gobain",
    "korea_company": "KCC",
    "global_firms": [
      {
        "name": "Saint-Gobain",
        "share": 5
      },
      {
        "name": "CRH",
        "share": 4
      },
      {
        "name": "Holcim",
        "share": 3
      }
    ]
  },
  "201030": {
    "gics": "201030",
    "industry_en": "Construction & Engineering",
    "industry_ko": "건설·엔지니어링",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.5,
      "brand": 0.1,
      "scale": 0.1,
      "global": 0.3
    },
    "global_company": "China State Construction Engineering",
    "korea_company": "Hyundai E&C",
    "global_firms": [
      {
        "name": "CSCEC",
        "share": 2
      },
      {
        "name": "China Railway Grp중국중철",
        "share": 1.3
      },
      {
        "name": "CRCC",
        "share": 1.1
      }
    ]
  },
  "201040": {
    "gics": "201040",
    "industry_en": "Electrical Equipment",
    "industry_ko": "전기장비",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.125,
      "scale": 0.125,
      "global": 0.375
    },
    "global_company": "Schneider Electric",
    "korea_company": "Hyosung Heavy",
    "global_firms": [
      {
        "name": "Schneider",
        "share": 12
      },
      {
        "name": "Siemens Energy",
        "share": 11
      },
      {
        "name": "ABB",
        "share": 9
      }
    ]
  },
  "201050": {
    "gics": "201050",
    "industry_en": "Industrial Conglomerates",
    "industry_ko": "복합기업(산업재)",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.375,
      "scale": 0.125,
      "global": 0.125
    },
    "global_company": "Siemens AG",
    "korea_company": "Samsung C&T",
    "global_firms": [
      {
        "name": "Siemens",
        "share": 28
      },
      {
        "name": "Hitachi",
        "share": 24
      },
      {
        "name": "Honeywell",
        "share": 13
      }
    ]
  },
  "201060": {
    "gics": "201060",
    "industry_en": "Machinery",
    "industry_ko": "기계",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.125,
      "brand": 0.125,
      "scale": 0.125,
      "global": 0.625
    },
    "global_company": "Caterpillar",
    "korea_company": "Doosan Bobcat",
    "global_firms": [
      {
        "name": "Caterpillar",
        "share": 16
      },
      {
        "name": "Komatsu",
        "share": 11
      },
      {
        "name": "XCMG",
        "share": 6
      }
    ]
  },
  "201070": {
    "gics": "201070",
    "industry_en": "Trading Companies & Distributors",
    "industry_ko": "종합상사·유통",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.083,
      "scale": 0.25,
      "global": 0.417
    },
    "global_company": "Mitsubishi Corporation",
    "korea_company": "POSCO International",
    "global_firms": [
      {
        "name": "W.W. Grainger",
        "share": 5
      },
      {
        "name": "Ferguson",
        "share": 4
      },
      {
        "name": "Fastenal",
        "share": 3
      }
    ]
  },
  "202010": {
    "gics": "202010",
    "industry_en": "Commercial Services & Supplies",
    "industry_ko": "상업 서비스·용품",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.083,
      "global": 0.417
    },
    "global_company": "Waste Management",
    "korea_company": "S-1 Corporation",
    "global_firms": [
      {
        "name": "Waste Management",
        "share": 7
      },
      {
        "name": "Republic Services",
        "share": 6
      },
      {
        "name": "Veolia",
        "share": 5
      }
    ]
  },
  "202020": {
    "gics": "202020",
    "industry_en": "Professional Services",
    "industry_ko": "전문 서비스",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.083
    },
    "global_company": "ADP",
    "korea_company": "Saramin",
    "global_firms": [
      {
        "name": "ADP",
        "share": 4
      },
      {
        "name": "Randstad",
        "share": 3.5
      },
      {
        "name": "Adecco",
        "share": 3
      }
    ]
  },
  "203010": {
    "gics": "203010",
    "industry_en": "Air Freight & Logistics",
    "industry_ko": "항공화물·물류",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.188,
      "brand": 0.188,
      "scale": 0.438,
      "global": 0.188
    },
    "global_company": "FedEx",
    "korea_company": "CJ Logistics",
    "global_firms": [
      {
        "name": "FedEx",
        "share": 7
      },
      {
        "name": "Qatar Airways",
        "share": 6
      },
      {
        "name": "UPS",
        "share": 6
      }
    ]
  },
  "203020": {
    "gics": "203020",
    "industry_en": "Passenger Airlines",
    "industry_ko": "여객 항공",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.214,
      "scale": 0.357,
      "global": 0.214
    },
    "global_company": "Delta Air Lines",
    "korea_company": "Korean Air",
    "global_firms": [
      {
        "name": "Delta",
        "share": 21
      },
      {
        "name": "United",
        "share": 20
      },
      {
        "name": "American",
        "share": 19
      }
    ]
  },
  "203030": {
    "gics": "203030",
    "industry_en": "Marine Transportation",
    "industry_ko": "해상운송",
    "sector": "Industrials",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.071,
      "scale": 0.5,
      "global": 0.214
    },
    "global_company": "MSC",
    "korea_company": "HMM",
    "global_firms": [
      {
        "name": "MSC",
        "share": 22
      },
      {
        "name": "Maersk",
        "share": 14
      },
      {
        "name": "CMA CGM",
        "share": 13
      }
    ]
  },
  "251010": {
    "gics": "251010",
    "industry_en": "Automobile Components",
    "industry_ko": "자동차 부품",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "Bosch (Mobility)",
    "korea_company": "Hyundai Mobis",
    "global_firms": [
      {
        "name": "Bosch",
        "share": 16
      },
      {
        "name": "Denso",
        "share": 13
      },
      {
        "name": "Magna",
        "share": 12
      }
    ]
  },
  "251020": {
    "gics": "251020",
    "industry_en": "Automobiles",
    "industry_ko": "자동차",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.357,
      "brand": 0.214,
      "scale": 0.214,
      "global": 0.214
    },
    "global_company": "Tesla",
    "korea_company": "Hyundai Motor",
    "global_firms": [
      {
        "name": "Toyota",
        "share": 13
      },
      {
        "name": "Volkswagen",
        "share": 10
      },
      {
        "name": "Hyundai-Kia",
        "share": 8
      }
    ]
  },
  "252010": {
    "gics": "252010",
    "industry_en": "Household Durables",
    "industry_ko": "내구소비재",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.125,
      "scale": 0.375,
      "global": 0.125
    },
    "global_company": "D.R. Horton",
    "korea_company": "Coway",
    "global_firms": [
      {
        "name": "D.R. Horton",
        "share": 16
      },
      {
        "name": "Lennar",
        "share": 14
      },
      {
        "name": "PulteGroup",
        "share": 10
      }
    ]
  },
  "252030": {
    "gics": "252030",
    "industry_en": "Textiles, Apparel & Luxury Goods",
    "industry_ko": "섬유·의류·명품",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.3,
      "scale": 0.1,
      "global": 0.3
    },
    "global_company": "LVMH",
    "korea_company": "Youngone",
    "global_firms": [
      {
        "name": "LVMH",
        "share": 15
      },
      {
        "name": "Nike",
        "share": 8
      },
      {
        "name": "Inditex",
        "share": 7
      }
    ]
  },
  "253010": {
    "gics": "253010",
    "industry_en": "Diversified Consumer Services",
    "industry_ko": "종합 소비자 서비스",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.357,
      "brand": 0.214,
      "scale": 0.071,
      "global": 0.357
    },
    "global_company": "Service Corporation International",
    "korea_company": "MegaStudyEdu",
    "global_firms": [
      {
        "name": "Service Corp Intl",
        "share": 16
      },
      {
        "name": "Carriage Services",
        "share": 6
      },
      {
        "name": "Park Lawn / Foundation",
        "share": 4
      }
    ]
  },
  "255010": {
    "gics": "255010",
    "industry_en": "Distributors",
    "industry_ko": "유통(소비재)",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.1,
      "scale": 0.3,
      "global": 0.3
    },
    "global_company": "Genuine Parts Company",
    "korea_company": "K Car",
    "global_firms": [
      {
        "name": "Genuine Parts (NAPA)",
        "share": 9
      },
      {
        "name": "AutoZone",
        "share": 6
      },
      {
        "name": "O'Reilly",
        "share": 6
      }
    ]
  },
  "255030": {
    "gics": "255030",
    "industry_en": "Broadline Retail",
    "industry_ko": "종합 소매",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.1,
      "brand": 0.3,
      "scale": 0.3,
      "global": 0.3
    },
    "global_company": "Amazon",
    "korea_company": "Coupang",
    "global_firms": [
      {
        "name": "Amazon",
        "share": 16
      },
      {
        "name": "Alibaba",
        "share": 12
      },
      {
        "name": "PDD/Pinduoduo",
        "share": 7
      }
    ]
  },
  "255040": {
    "gics": "255040",
    "industry_en": "Specialty Retail",
    "industry_ko": "전문 소매",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "tech": 0.083,
      "brand": 0.417,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "Home Depot",
    "korea_company": "Lotte Hi-Mart",
    "global_firms": [
      {
        "name": "Home Depot",
        "share": 7
      },
      {
        "name": "Lowe's",
        "share": 5
      },
      {
        "name": "TJX",
        "share": 3
      }
    ]
  },
  "301010": {
    "gics": "301010",
    "industry_en": "Consumer Staples Distribution & Retail",
    "industry_ko": "필수소비재 유통·소매",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.1,
      "scale": 0.3,
      "global": 0.3
    },
    "global_company": "Walmart",
    "korea_company": "Emart",
    "global_firms": [
      {
        "name": "Walmart",
        "share": 5
      },
      {
        "name": "Costco",
        "share": 2
      },
      {
        "name": "Kroger",
        "share": 1
      }
    ]
  },
  "302010": {
    "gics": "302010",
    "industry_en": "Beverages",
    "industry_ko": "음료",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.312,
      "brand": 0.312,
      "scale": 0.062,
      "global": 0.312
    },
    "global_company": "Coca-Cola",
    "korea_company": "Lotte Chilsung",
    "global_firms": [
      {
        "name": "Coca-Cola",
        "share": 33
      },
      {
        "name": "PepsiCo",
        "share": 23
      },
      {
        "name": "AB InBev",
        "share": 17
      }
    ]
  },
  "302020": {
    "gics": "302020",
    "industry_en": "Food Products",
    "industry_ko": "식품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.1,
      "brand": 0.3,
      "scale": 0.3,
      "global": 0.3
    },
    "global_company": "Nestlé",
    "korea_company": "CJ CheilJedang",
    "global_firms": [
      {
        "name": "Nestlé",
        "share": 4
      },
      {
        "name": "PepsiCo",
        "share": 3
      },
      {
        "name": "Mondelez",
        "share": 2
      }
    ]
  },
  "302030": {
    "gics": "302030",
    "industry_en": "Tobacco",
    "industry_ko": "담배",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.357,
      "scale": 0.071,
      "global": 0.357
    },
    "global_company": "Philip Morris International",
    "korea_company": "KT&G",
    "global_firms": [
      {
        "name": "China National Tobacco",
        "share": 44
      },
      {
        "name": "Philip Morris Intl",
        "share": 14
      },
      {
        "name": "BAT",
        "share": 9
      }
    ]
  },
  "303010": {
    "gics": "303010",
    "industry_en": "Household Products",
    "industry_ko": "생활용품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.357,
      "brand": 0.214,
      "scale": 0.214,
      "global": 0.214
    },
    "global_company": "Procter & Gamble",
    "korea_company": "LG H&H",
    "global_firms": [
      {
        "name": "P&amp;G",
        "share": 13
      },
      {
        "name": "Unilever",
        "share": 7
      },
      {
        "name": "Reckitt",
        "share": 5
      }
    ]
  },
  "303020": {
    "gics": "303020",
    "industry_en": "Personal Care Products",
    "industry_ko": "퍼스널케어 제품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "tech": 0.312,
      "brand": 0.188,
      "scale": 0.062,
      "global": 0.438
    },
    "global_company": "L'Oréal",
    "korea_company": "Amorepacific",
    "global_firms": [
      {
        "name": "L'Oréal",
        "share": 13
      },
      {
        "name": "Unilever",
        "share": 9
      },
      {
        "name": "P&G",
        "share": 6
      }
    ]
  },
  "351010": {
    "gics": "351010",
    "industry_en": "Health Care Equipment & Supplies",
    "industry_ko": "의료기기 및 용품",
    "sector": "Health Care",
    "ksf_weights": {
      "tech": 0.357,
      "brand": 0.071,
      "scale": 0.357,
      "global": 0.214
    },
    "global_company": "Medtronic",
    "korea_company": "Osstem Implant",
    "global_firms": [
      {
        "name": "Medtronic",
        "share": 5
      },
      {
        "name": "J&J MedTech",
        "share": 5
      },
      {
        "name": "Stryker",
        "share": 4
      }
    ]
  },
  "351020": {
    "gics": "351020",
    "industry_en": "Health Care Providers & Services",
    "industry_ko": "헬스케어 제공·서비스",
    "sector": "Health Care",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.214,
      "scale": 0.357,
      "global": 0.214
    },
    "global_company": "UnitedHealth Group",
    "korea_company": "SD Biosensor (proxy)",
    "global_firms": [
      {
        "name": "UnitedHealth",
        "share": 16
      },
      {
        "name": "Elevance",
        "share": 12
      },
      {
        "name": "CVS/Aetna",
        "share": 12
      }
    ]
  },
  "351030": {
    "gics": "351030",
    "industry_en": "Health Care Technology",
    "industry_ko": "헬스케어 기술",
    "sector": "Health Care",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.3,
      "scale": 0.1,
      "global": 0.3
    },
    "global_company": "Veeva Systems",
    "korea_company": "Lunit",
    "global_firms": [
      {
        "name": "Epic Systems",
        "share": 44
      },
      {
        "name": "Oracle Health (Cerner)",
        "share": 22
      },
      {
        "name": "MEDITECH",
        "share": 15
      }
    ]
  },
  "352030": {
    "gics": "352030",
    "industry_en": "Life Sciences Tools & Services",
    "industry_ko": "생명과학 도구 및 서비스",
    "sector": "Health Care",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.083,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "Thermo Fisher Scientific",
    "korea_company": "Samsung Biologics",
    "global_firms": [
      {
        "name": "Thermo Fisher",
        "share": 33
      },
      {
        "name": "Danaher",
        "share": 18
      },
      {
        "name": "Agilent",
        "share": 13
      }
    ]
  },
  "401010": {
    "gics": "401010",
    "industry_en": "Banks",
    "industry_ko": "은행",
    "sector": "Financials",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.125,
      "scale": 0.375,
      "global": 0.125
    },
    "global_company": "JPMorgan Chase",
    "korea_company": "KB Financial Group",
    "global_firms": [
      {
        "name": "ICBC",
        "share": 27
      },
      {
        "name": "Agricultural Bank of China중국농업은행",
        "share": 24
      },
      {
        "name": "China Construction Bank중국건설은행",
        "share": 23
      }
    ]
  },
  "402010": {
    "gics": "402010",
    "industry_en": "Financial Services",
    "industry_ko": "금융 서비스",
    "sector": "Financials",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "Visa",
    "korea_company": "Samsung Card",
    "global_firms": [
      {
        "name": "Visa",
        "share": 52
      },
      {
        "name": "Mastercard",
        "share": 22
      },
      {
        "name": "American Express",
        "share": 15
      }
    ]
  },
  "402030": {
    "gics": "402030",
    "industry_en": "Capital Markets",
    "industry_ko": "자본시장",
    "sector": "Financials",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.083,
      "scale": 0.25,
      "global": 0.25
    },
    "global_company": "BlackRock",
    "korea_company": "Mirae Asset",
    "global_firms": [
      {
        "name": "BlackRock",
        "share": 10
      },
      {
        "name": "Vanguard",
        "share": 9
      },
      {
        "name": "Fidelity",
        "share": 4
      }
    ]
  },
  "402040": {
    "gics": "402040",
    "industry_en": "Mortgage REITs",
    "industry_ko": "모기지 리츠",
    "sector": "Financials",
    "ksf_weights": {
      "tech": 0.167,
      "brand": 0.167,
      "scale": 0.167,
      "global": 0.5
    },
    "global_company": "Annaly Capital",
    "korea_company": "KHFC (proxy)",
    "global_firms": [
      {
        "name": "Annaly",
        "share": 20
      },
      {
        "name": "AGNC",
        "share": 15
      },
      {
        "name": "Starwood",
        "share": 10
      }
    ]
  },
  "403010": {
    "gics": "403010",
    "industry_en": "Insurance",
    "industry_ko": "보험",
    "sector": "Financials",
    "ksf_weights": {
      "tech": 0.375,
      "brand": 0.125,
      "scale": 0.125,
      "global": 0.375
    },
    "global_company": "Allianz",
    "korea_company": "Samsung Life",
    "global_firms": [
      {
        "name": "Allianz",
        "share": 3
      },
      {
        "name": "Ping An",
        "share": 2
      },
      {
        "name": "China Life",
        "share": 2
      }
    ]
  },
  "451020": {
    "gics": "451020",
    "industry_en": "IT Services",
    "industry_ko": "IT 서비스",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "Accenture",
    "korea_company": "Samsung SDS",
    "global_firms": [
      {
        "name": "Accenture",
        "share": 4
      },
      {
        "name": "TCS",
        "share": 2
      },
      {
        "name": "IBM Consulting",
        "share": 2
      }
    ]
  },
  "451030": {
    "gics": "451030",
    "industry_en": "Software",
    "industry_ko": "소프트웨어",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "Microsoft",
    "korea_company": "Samsung SDS",
    "global_firms": [
      {
        "name": "Microsoft",
        "share": 11
      },
      {
        "name": "Oracle",
        "share": 5
      },
      {
        "name": "SAP",
        "share": 3
      }
    ]
  },
  "452010": {
    "gics": "452010",
    "industry_en": "Communications Equipment",
    "industry_ko": "통신장비",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.5,
      "brand": 0.214,
      "scale": 0.214,
      "global": 0.071
    },
    "global_company": "Cisco Systems",
    "korea_company": "Samsung Electronics",
    "global_firms": [
      {
        "name": "Huawei",
        "share": 31
      },
      {
        "name": "Nokia",
        "share": 13
      },
      {
        "name": "Ericsson",
        "share": 12
      }
    ]
  },
  "452020": {
    "gics": "452020",
    "industry_en": "Technology Hardware, Storage & Peripherals",
    "industry_ko": "기술 하드웨어·스토리지·주변기기",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.083
    },
    "global_company": "Apple",
    "korea_company": "Samsung Electronics",
    "global_firms": [
      {
        "name": "Apple",
        "share": 20
      },
      {
        "name": "Samsung",
        "share": 19
      },
      {
        "name": "Xiaomi",
        "share": 13
      }
    ]
  },
  "452030": {
    "gics": "452030",
    "industry_en": "Electronic Equipment, Instruments & Components",
    "industry_ko": "전자장비·계측·부품",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.083
    },
    "global_company": "Hon Hai (Foxconn)",
    "korea_company": "LG Innotek",
    "global_firms": [
      {
        "name": "Foxconn",
        "share": 39
      },
      {
        "name": "Quanta",
        "share": 8
      },
      {
        "name": "Pegatron",
        "share": 6
      }
    ]
  },
  "453010": {
    "gics": "453010",
    "industry_en": "Semiconductors & Semiconductor Equipment",
    "industry_ko": "반도체·반도체장비",
    "sector": "Information Technology",
    "ksf_weights": {
      "tech": 0.357,
      "brand": 0.071,
      "scale": 0.214,
      "global": 0.357
    },
    "global_company": "NVIDIA",
    "korea_company": "Samsung Electronics",
    "global_firms": [
      {
        "name": "NVIDIA",
        "share": 16
      },
      {
        "name": "Samsung",
        "share": 9
      },
      {
        "name": "SK hynix",
        "share": 8
      }
    ]
  },
  "501010": {
    "gics": "501010",
    "industry_en": "Diversified Telecommunication Services",
    "industry_ko": "종합 통신 서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.25,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "Deutsche Telekom",
    "korea_company": "KT Corporation",
    "global_firms": [
      {
        "name": "Deutsche Telekom",
        "share": 17
      },
      {
        "name": "Verizon",
        "share": 17
      },
      {
        "name": "AT&T",
        "share": 16
      }
    ]
  },
  "501020": {
    "gics": "501020",
    "industry_en": "Wireless Telecommunication Services",
    "industry_ko": "무선 통신 서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "tech": 0.417,
      "brand": 0.25,
      "scale": 0.25,
      "global": 0.083
    },
    "global_company": "China Mobile",
    "korea_company": "SK Telecom",
    "global_firms": [
      {
        "name": "China Mobile",
        "share": 19
      },
      {
        "name": "Reliance Jio",
        "share": 6
      },
      {
        "name": "China Telecom",
        "share": 5
      }
    ]
  },
  "502010": {
    "gics": "502010",
    "industry_en": "Media",
    "industry_ko": "미디어",
    "sector": "Communication Services",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.3,
      "scale": 0.3,
      "global": 0.1
    },
    "global_company": "Omnicom",
    "korea_company": "Cheil Worldwide",
    "global_firms": [
      {
        "name": "Omnicom (incl. IPG)",
        "share": 30
      },
      {
        "name": "Publicis",
        "share": 23
      },
      {
        "name": "WPP",
        "share": 20
      }
    ]
  },
  "502020": {
    "gics": "502020",
    "industry_en": "Entertainment",
    "industry_ko": "엔터테인먼트",
    "sector": "Communication Services",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.417,
      "scale": 0.25,
      "global": 0.083
    },
    "global_company": "Netflix",
    "korea_company": "KRAFTON",
    "global_firms": [
      {
        "name": "Netflix",
        "share": 28
      },
      {
        "name": "Prime Video",
        "share": 18
      },
      {
        "name": "Disney+",
        "share": 11
      }
    ]
  },
  "502030": {
    "gics": "502030",
    "industry_en": "Interactive Media & Services",
    "industry_ko": "인터랙티브 미디어·서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.3,
      "scale": 0.3,
      "global": 0.1
    },
    "global_company": "Alphabet (Google)",
    "korea_company": "NAVER",
    "global_firms": [
      {
        "name": "Meta",
        "share": 26.8
      },
      {
        "name": "Google",
        "share": 26.4
      },
      {
        "name": "Amazon",
        "share": 9
      }
    ]
  },
  "551010": {
    "gics": "551010",
    "industry_en": "Electric Utilities",
    "industry_ko": "전력 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "tech": 0.214,
      "brand": 0.214,
      "scale": 0.357,
      "global": 0.214
    },
    "global_company": "NextEra Energy",
    "korea_company": "KEPCO",
    "global_firms": [
      {
        "name": "NextEra Energy",
        "share": 18
      },
      {
        "name": "Iberdrola",
        "share": 14
      },
      {
        "name": "Enel",
        "share": 10
      }
    ]
  },
  "551040": {
    "gics": "551040",
    "industry_en": "Water Utilities",
    "industry_ko": "수도 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.083,
      "scale": 0.417,
      "global": 0.25
    },
    "global_company": "American Water Works",
    "korea_company": "K-water (proxy)",
    "global_firms": [
      {
        "name": "Veolia (water)",
        "share": 55
      },
      {
        "name": "American Water",
        "share": 14
      },
      {
        "name": "Severn Trent",
        "share": 8
      }
    ]
  },
  "551050": {
    "gics": "551050",
    "industry_en": "Independent Power & Renewable Electricity Producers",
    "industry_ko": "민자·재생에너지 발전",
    "sector": "Utilities",
    "ksf_weights": {
      "tech": 0.25,
      "brand": 0.083,
      "scale": 0.417,
      "global": 0.25
    },
    "global_company": "NextEra Energy",
    "korea_company": "KEPCO (proxy)",
    "global_firms": [
      {
        "name": "NextEra",
        "share": 38
      },
      {
        "name": "Iberdrola",
        "share": 29
      },
      {
        "name": "Brookfield Ren.",
        "share": 10
      }
    ]
  },
  "601010": {
    "gics": "601010",
    "industry_en": "Diversified REITs",
    "industry_ko": "종합 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.125,
      "brand": 0.125,
      "scale": 0.625,
      "global": 0.125
    },
    "global_company": "W.P. Carey",
    "korea_company": "SK REIT",
    "global_firms": [
      {
        "name": "W.P. Carey",
        "share": 30
      },
      {
        "name": "Stockland",
        "share": 20
      },
      {
        "name": "Mirvac",
        "share": 13
      }
    ]
  },
  "601025": {
    "gics": "601025",
    "industry_en": "Industrial REITs",
    "industry_ko": "산업·물류 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.3,
      "brand": 0.1,
      "scale": 0.5,
      "global": 0.1
    },
    "global_company": "Prologis",
    "korea_company": "ESR Kendall Square REIT",
    "global_firms": [
      {
        "name": "Prologis",
        "share": 38
      },
      {
        "name": "Goodman Group",
        "share": 15
      },
      {
        "name": "SEGRO",
        "share": 5
      }
    ]
  },
  "601030": {
    "gics": "601030",
    "industry_en": "Hotel & Resort REITs",
    "industry_ko": "호텔·리조트 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.1,
      "brand": 0.3,
      "scale": 0.5,
      "global": 0.1
    },
    "global_company": "Host Hotels & Resorts",
    "korea_company": "Hotel Shilla (proxy)",
    "global_firms": [
      {
        "name": "Host Hotels",
        "share": 54
      },
      {
        "name": "Ryman Hospitality",
        "share": 24
      },
      {
        "name": "Apple Hospitality",
        "share": 11
      }
    ]
  },
  "601040": {
    "gics": "601040",
    "industry_en": "Office REITs",
    "industry_ko": "오피스 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.5,
      "brand": 0.1,
      "scale": 0.3,
      "global": 0.1
    },
    "global_company": "BXP (Boston Properties)",
    "korea_company": "Shinhan Alpha REIT",
    "global_firms": [
      {
        "name": "BXP",
        "share": 27
      },
      {
        "name": "Vornado",
        "share": 18
      },
      {
        "name": "Cousins",
        "share": 11
      }
    ]
  },
  "601060": {
    "gics": "601060",
    "industry_en": "Residential REITs",
    "industry_ko": "주거용 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.1,
      "brand": 0.1,
      "scale": 0.5,
      "global": 0.3
    },
    "global_company": "AvalonBay Communities",
    "korea_company": "SK REIT (proxy)",
    "global_firms": [
      {
        "name": "AvalonBay",
        "share": 14
      },
      {
        "name": "Equity Residential",
        "share": 13
      },
      {
        "name": "Invitation Homes",
        "share": 9
      }
    ]
  },
  "601070": {
    "gics": "601070",
    "industry_en": "Retail REITs",
    "industry_ko": "리테일 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "tech": 0.083,
      "brand": 0.417,
      "scale": 0.417,
      "global": 0.083
    },
    "global_company": "Simon Property Group",
    "korea_company": "Lotte REIT",
    "global_firms": [
      {
        "name": "Simon Property",
        "share": 27
      },
      {
        "name": "Realty Income",
        "share": 22
      },
      {
        "name": "Regency Centers",
        "share": 11
      }
    ]
  }
};
