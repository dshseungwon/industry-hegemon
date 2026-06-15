// 자동 생성 스냅샷 — The Industry Brief 실데이터(KSF + 실제 글로벌/한국 점유율 + 시장규모).
// 출처: daily-industry-report/game_data.json (build/game_data.py가 리포트 D딕트에서 추출).
// 재생성: 자매 레포에서 game_data.py 실행 후 `npm run gen:data`.
import { Cap } from "./state";
export interface GameFirm { name: string; ko?: string; share: number; }
export interface GameData {
  gics: string; industry_en: string; industry_ko: string; sector: string;
  ksf_weights: Record<Cap, number>;
  global_company: string; korea_company: string;
  global_firms: GameFirm[];
  korea_firms?: GameFirm[];                 // 실제 한국 시장 점유율(있으면)
  market?: { label: string; trillion_usd: number; year: string };
  cagr?: string;
}
export const GAME_DATA: Record<string, GameData> = {
  "101010": {
    "gics": "101010",
    "industry_en": "Energy Equipment & Services",
    "industry_ko": "에너지 장비 및 서비스",
    "sector": "Energy",
    "ksf_weights": {
      "brand": 0.1333,
      "global": 0.2667,
      "scale": 0.2,
      "tech": 0.4
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
      },
      {
        "name": "Weatherford",
        "share": 2
      },
      {
        "ko": "기타 (NOV, 테크닙FMC, 시추사, 국영석유사 계열)",
        "name": "Others (NOV, TechnipFMC, drillers, NOC arms)",
        "share": 70
      }
    ],
    "korea_firms": [
      {
        "name": "Hanwha Ocean",
        "share": 35
      },
      {
        "ko": "삼성중공업",
        "name": "Samsung Heavy Industries",
        "share": 35
      },
      {
        "name": "HD Hyundai",
        "share": 20
      },
      {
        "ko": "기타 (SK오션플랜트 등)",
        "name": "Others (SK Oceanplant etc.)",
        "share": 10
      }
    ],
    "market": {
      "label": "$126B",
      "trillion_usd": 0.126,
      "year": "2025"
    },
    "cagr": "≈5.8%"
  },
  "101020": {
    "gics": "101020",
    "industry_en": "Oil, Gas & Consumable Fuels",
    "industry_ko": "석유·가스·소비연료",
    "sector": "Energy",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.8571,
      "tech": 0.1429
    },
    "global_company": "Saudi Aramco",
    "korea_company": "SK Innovation",
    "global_firms": [],
    "korea_firms": [
      {
        "name": "Saudi Aramco",
        "share": 62
      },
      {
        "name": "ExxonMobil",
        "share": 22
      },
      {
        "name": "Chevron",
        "share": 7
      },
      {
        "name": "PetroChina",
        "share": 5
      },
      {
        "name": "Shell",
        "share": 4
      }
    ],
    "market": {
      "label": "$8.34T",
      "trillion_usd": 8.34,
      "year": "2025"
    },
    "cagr": "~5.4%"
  },
  "151010": {
    "gics": "151010",
    "industry_en": "Chemicals",
    "industry_ko": "화학",
    "sector": "Materials",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.55,
      "tech": 0.45
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
      },
      {
        "name": "SABIC",
        "share": 15
      },
      {
        "name": "LyondellBasell",
        "share": 14
      }
    ],
    "korea_firms": [
      {
        "ko": "화학",
        "name": "LG",
        "share": 58
      },
      {
        "name": "한화솔루션",
        "share": 15
      },
      {
        "name": "SKC",
        "share": 12
      },
      {
        "name": "롯데케미칼",
        "share": 8
      },
      {
        "name": "금호석유화학",
        "share": 7
      }
    ],
    "market": {
      "label": "$0.98T",
      "trillion_usd": 0.98,
      "year": "2024"
    },
    "cagr": "~5.0%"
  },
  "151020": {
    "gics": "151020",
    "industry_en": "Construction Materials",
    "industry_ko": "건축자재",
    "sector": "Materials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.2857,
      "scale": 0.6667,
      "tech": 0.0476
    },
    "global_company": "CRH plc",
    "korea_company": "Ssangyong C&E",
    "global_firms": [
      {
        "name": "CRH",
        "share": 31
      },
      {
        "name": "Holcim",
        "share": 26
      },
      {
        "name": "Heidelberg",
        "share": 20
      },
      {
        "name": "Cemex",
        "share": 14
      },
      {
        "name": "UltraTech",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "한일시멘트",
        "share": 30
      },
      {
        "name": "쌍용C&E",
        "share": 29
      },
      {
        "name": "성신양회",
        "share": 20
      },
      {
        "name": "아세아시멘트",
        "share": 17
      },
      {
        "name": "한일현대시멘트",
        "share": 4
      }
    ],
    "market": {
      "label": "$385B",
      "trillion_usd": 0.385,
      "year": "2024"
    },
    "cagr": "~3.3%"
  },
  "151030": {
    "gics": "151030",
    "industry_en": "Containers & Packaging",
    "industry_ko": "용기·포장",
    "sector": "Materials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.25,
      "scale": 0.6667,
      "tech": 0.0833
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
      },
      {
        "name": "Crown",
        "share": 14
      },
      {
        "ko": "기타 상장사",
        "name": "Others listed",
        "share": 10
      }
    ],
    "korea_firms": [
      {
        "name": "Dongwon Systems",
        "share": 10
      },
      {
        "name": "Lotte Packaging",
        "share": 5
      },
      {
        "name": "Sam-A Aluminium",
        "share": 2
      }
    ],
    "market": {
      "label": "$1.18T",
      "trillion_usd": 1.18,
      "year": "2024"
    },
    "cagr": "≈3.4%"
  },
  "151040": {
    "gics": "151040",
    "industry_en": "Metals & Mining",
    "industry_ko": "금속·광업",
    "sector": "Materials",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.9091,
      "tech": 0.0909
    },
    "global_company": "BHP Group",
    "korea_company": "POSCO Holdings",
    "global_firms": [
      {
        "name": "BHP",
        "share": 34
      },
      {
        "name": "Rio Tinto",
        "share": 25
      },
      {
        "name": "Freeport-McMoRan",
        "share": 15
      },
      {
        "name": "Glencore",
        "share": 13
      },
      {
        "name": "Agnico Eagle",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "name": "포스코홀딩스",
        "share": 48
      },
      {
        "name": "고려아연",
        "share": 42
      },
      {
        "name": "현대제철",
        "share": 6
      },
      {
        "ko": "스틸",
        "name": "KG",
        "share": 3
      },
      {
        "name": "동국제강",
        "share": 1
      }
    ],
    "market": {
      "label": "$1.94T",
      "trillion_usd": 1.94,
      "year": "2024"
    },
    "cagr": "~6.3%"
  },
  "151050": {
    "gics": "151050",
    "industry_en": "Paper & Forest Products",
    "industry_ko": "제지·임산물",
    "sector": "Materials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.1,
      "scale": 0.55,
      "tech": 0.35
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
      },
      {
        "name": "Stora Enso",
        "share": 3
      }
    ],
    "korea_firms": [
      {
        "name": "Hansol Paper",
        "share": 44
      },
      {
        "name": "Moorim",
        "share": 31
      },
      {
        "name": "Asia Paper",
        "share": 25
      }
    ],
    "market": {
      "label": "$345B",
      "trillion_usd": 0.345,
      "year": "2024"
    },
    "cagr": "≈1.7%"
  },
  "201010": {
    "gics": "201010",
    "industry_en": "Aerospace & Defense",
    "industry_ko": "항공우주·방위",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.3846,
      "global": 0.5385,
      "scale": 0.0769,
      "tech": 0
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
      },
      {
        "name": "General Dynamics",
        "share": 16
      },
      {
        "name": "Boeing Defense",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "name": "Hanwha Aerospace",
        "share": 45
      },
      {
        "name": "Hyundai Rotem",
        "share": 25
      },
      {
        "name": "KAI",
        "share": 17
      },
      {
        "name": "LIG Nex1",
        "share": 13
      }
    ],
    "market": {
      "label": "$885B",
      "trillion_usd": 0.885,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "201020": {
    "gics": "201020",
    "industry_en": "Building Products",
    "industry_ko": "건축자재",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.1905,
      "global": 0.3333,
      "scale": 0.3333,
      "tech": 0.1429
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
      },
      {
        "name": "Cemex",
        "share": 2
      }
    ],
    "korea_firms": [
      {
        "name": "KCC",
        "share": 35
      },
      {
        "name": "LX Hausys",
        "share": 25
      },
      {
        "name": "KCC Glass",
        "share": 13
      }
    ],
    "market": {
      "label": "$1.37T",
      "trillion_usd": 1.37,
      "year": "2024"
    },
    "cagr": "≈3.9%"
  },
  "201030": {
    "gics": "201030",
    "industry_en": "Construction & Engineering",
    "industry_ko": "건설·엔지니어링",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.4167,
      "global": 0.25,
      "scale": 0,
      "tech": 0.3333
    },
    "global_company": "China State Construction Engineering",
    "korea_company": "Hyundai E&C",
    "global_firms": [
      {
        "name": "CSCEC",
        "share": 2
      },
      {
        "ko": "중국중철",
        "name": "China Railway Grp",
        "share": 1.3
      },
      {
        "name": "CRCC",
        "share": 1.1
      },
      {
        "name": "VINCI",
        "share": 0.8
      }
    ],
    "korea_firms": [
      {
        "ko": "삼성물산",
        "name": "Samsung C&T",
        "share": 23
      },
      {
        "ko": "현대건설",
        "name": "Hyundai E&C",
        "share": 11
      },
      {
        "ko": "대우건설",
        "name": "Daewoo E&C",
        "share": 8
      },
      {
        "ko": "이앤씨",
        "name": "DL E&CDL",
        "share": 7
      }
    ],
    "market": {
      "label": "$15.8T",
      "trillion_usd": 15.8,
      "year": "2024"
    },
    "cagr": "≈5.6%"
  },
  "201040": {
    "gics": "201040",
    "industry_en": "Electrical Equipment",
    "industry_ko": "전력기기",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.0714,
      "global": 0,
      "scale": 0.4286,
      "tech": 0.5
    },
    "global_company": "ABB",
    "korea_company": "HD Hyundai Electric",
    "global_firms": [
      {
        "name": "Schneider Electric",
        "share": 38
      },
      {
        "name": "Eaton",
        "share": 16
      },
      {
        "name": "Hitachi Energy",
        "share": 15
      },
      {
        "name": "ABB (Electrification)",
        "share": 14
      },
      {
        "name": "GE Vernova",
        "share": 17
      }
    ],
    "korea_firms": [
      {
        "name": "효성중공업",
        "share": 31
      },
      {
        "ko": "일렉트릭",
        "name": "LS",
        "share": 26
      },
      {
        "ko": "현대일렉트릭",
        "name": "HD",
        "share": 18
      },
      {
        "name": "대한전선",
        "share": 17
      },
      {
        "name": "일진전기",
        "share": 8
      }
    ],
    "market": {
      "label": "$1.66T",
      "trillion_usd": 1.66,
      "year": "2024"
    },
    "cagr": "~6.1%"
  },
  "201050": {
    "gics": "201050",
    "industry_en": "Industrial Conglomerates",
    "industry_ko": "복합기업(산업재)",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.0667,
      "global": 0.6,
      "scale": 0,
      "tech": 0.3333
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
      },
      {
        "name": "3M",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "SK Inc",
        "share": 46
      },
      {
        "name": "Hanwha",
        "share": 33
      },
      {
        "name": "Samsung C&T",
        "share": 19
      }
    ],
    "market": {
      "label": "$2.40T",
      "trillion_usd": 2.4,
      "year": "2024"
    },
    "cagr": "≈0.7%"
  },
  "201060": {
    "gics": "201060",
    "industry_en": "Machinery",
    "industry_ko": "기계",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.6923,
      "scale": 0,
      "tech": 0.3077
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
      },
      {
        "name": "John Deere",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "name": "Doosan Bobcat",
        "share": 52
      },
      {
        "name": "HD Construction Equip.",
        "share": 33
      }
    ],
    "market": {
      "label": "$157B",
      "trillion_usd": 0.157,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "201070": {
    "gics": "201070",
    "industry_en": "Trading Companies & Distributors",
    "industry_ko": "종합상사·유통",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.7895,
      "scale": 0,
      "tech": 0.2105
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
      },
      {
        "name": "Würth (industrial)",
        "share": 3
      }
    ],
    "korea_firms": [
      {
        "name": "POSCO International",
        "share": 57
      },
      {
        "name": "Samsung C&T (Trading)",
        "share": 28
      },
      {
        "name": "LX International",
        "share": 15
      }
    ],
    "market": {
      "label": "$72B",
      "trillion_usd": 0.072,
      "year": "2024"
    },
    "cagr": "≈4.4%"
  },
  "202010": {
    "gics": "202010",
    "industry_en": "Commercial Services & Supplies",
    "industry_ko": "상업 서비스·용품",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.1429,
      "scale": 0.7857,
      "tech": 0.0714
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
      },
      {
        "name": "Waste Connections",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "S-1",
        "share": 28
      },
      {
        "name": "SK Shieldus",
        "share": 26
      },
      {
        "name": "SK ecoplant",
        "share": 22
      }
    ],
    "market": {
      "label": "$1.22T",
      "trillion_usd": 1.22,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "202020": {
    "gics": "202020",
    "industry_en": "Professional Services",
    "industry_ko": "전문 서비스",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.0526,
      "global": 0,
      "scale": 0.2105,
      "tech": 0.7368
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
      },
      {
        "name": "RELX",
        "share": 2
      }
    ],
    "korea_firms": [
      {
        "name": "Saramin",
        "share": 34
      },
      {
        "name": "JobKorea (PE-owned)",
        "share": 24
      },
      {
        "name": "Wanted Lab",
        "share": 13
      }
    ],
    "market": {
      "label": "$6.00T",
      "trillion_usd": 6,
      "year": "2024"
    },
    "cagr": "≈6.2%"
  },
  "203010": {
    "gics": "203010",
    "industry_en": "Air Freight & Logistics",
    "industry_ko": "항공화물·물류",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.1429,
      "global": 0.1905,
      "scale": 0.6667,
      "tech": 0
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
      },
      {
        "name": "Emirates",
        "share": 5
      },
      {
        "name": "All other carriers",
        "share": 76
      }
    ],
    "korea_firms": [
      {
        "name": "Coupang (captive)",
        "share": 37.6
      },
      {
        "name": "CJ Logistics",
        "share": 27.6
      },
      {
        "name": "Lotte Global Logistics",
        "share": 10.3
      },
      {
        "name": "Hanjin",
        "share": 9.7
      },
      {
        "name": "Logen",
        "share": 5.3
      }
    ],
    "market": {
      "label": "$319B",
      "trillion_usd": 0.319,
      "year": "2024"
    },
    "cagr": "≈5%"
  },
  "203020": {
    "gics": "203020",
    "industry_en": "Passenger Airlines",
    "industry_ko": "여객 항공",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0.2105,
      "global": 0.2632,
      "scale": 0.5263,
      "tech": 0
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
      },
      {
        "name": "Emirates",
        "share": 14
      },
      {
        "ko": "기타(상위 그룹)",
        "name": "Others (top groups)",
        "share": 26
      }
    ],
    "korea_firms": [
      {
        "ko": "대한항공 + 아시아나",
        "name": "Korean Air + Asiana",
        "share": 73
      },
      {
        "name": "Jeju Air",
        "share": 13
      },
      {
        "name": "T'way",
        "share": 9
      }
    ],
    "market": {
      "label": "$0.83T",
      "trillion_usd": 0.83,
      "year": "2024"
    },
    "cagr": "≈4.5%"
  },
  "203030": {
    "gics": "203030",
    "industry_en": "Marine Transportation",
    "industry_ko": "해상운송",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.3158,
      "scale": 0.4737,
      "tech": 0.2105
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
      },
      {
        "name": "COSCO",
        "share": 11
      },
      {
        "name": "Hapag-Lloyd + ONE",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "name": "HMM",
        "share": 72
      },
      {
        "name": "KMTC",
        "share": 10
      },
      {
        "name": "Sinokor",
        "share": 10
      },
      {
        "ko": "상선",
        "name": "SM",
        "share": 5
      },
      {
        "name": "흥아라인 등",
        "share": 3
      }
    ],
    "market": {
      "label": "$600B",
      "trillion_usd": 0.6,
      "year": "2025"
    },
    "cagr": "~5.4%"
  },
  "203040": {
    "gics": "203040",
    "industry_en": "Ground Transportation",
    "industry_ko": "육상운송",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.0556,
      "scale": 0.8333,
      "tech": 0.1111
    },
    "global_company": "Union Pacific",
    "korea_company": "CJ Logistics",
    "global_firms": [
      {
        "name": "Union Pacific",
        "share": 34
      },
      {
        "name": "CSX",
        "share": 19
      },
      {
        "name": "CPKC",
        "share": 17
      },
      {
        "name": "Canadian National",
        "share": 15
      },
      {
        "name": "Norfolk Southern",
        "share": 15
      }
    ],
    "korea_firms": [
      {
        "name": "현대글로비스",
        "share": 53
      },
      {
        "ko": "대한통운",
        "name": "CJ",
        "share": 22
      },
      {
        "name": "KORAIL",
        "share": 13
      },
      {
        "name": "롯데글로벌로지스",
        "share": 6
      },
      {
        "name": "한진",
        "share": 6
      }
    ],
    "market": {
      "label": "$4.25T",
      "trillion_usd": 4.25,
      "year": "2024"
    },
    "cagr": "~5.0%"
  },
  "203050": {
    "gics": "203050",
    "industry_en": "Transportation Infrastructure",
    "industry_ko": "교통 인프라",
    "sector": "Industrials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.5556,
      "scale": 0.4444,
      "tech": 0
    },
    "global_company": "Aena",
    "korea_company": "맥쿼리한국인프라투융자 (MKIF)",
    "global_firms": [
      {
        "name": "Aena",
        "share": 32
      },
      {
        "name": "Transurban",
        "share": 19
      },
      {
        "name": "Ferrovial",
        "share": 17
      },
      {
        "name": "ADP (Aéroports de Paris)",
        "share": 17
      },
      {
        "name": "Getlink",
        "share": 15
      }
    ],
    "korea_firms": [
      {
        "name": "맥쿼리한국인프라투융자",
        "share": 62
      },
      {
        "name": "한국공항",
        "share": 20
      },
      {
        "name": "제이트로닉스/티웨이홀딩스 계열",
        "share": 10
      },
      {
        "name": "기타 SOC 펀드",
        "share": 6
      },
      {
        "name": "기타",
        "share": 2
      }
    ],
    "market": {
      "label": "$3.48T",
      "trillion_usd": 3.48,
      "year": "2024"
    },
    "cagr": "~5%"
  },
  "251010": {
    "gics": "251010",
    "industry_en": "Automobile Components",
    "industry_ko": "자동차 부품",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0,
      "global": 0.55,
      "scale": 0.2,
      "tech": 0.25
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
      },
      {
        "name": "ZF",
        "share": 11
      },
      {
        "name": "Hyundai Mobis",
        "share": 10
      }
    ],
    "korea_firms": [
      {
        "name": "Hyundai Mobis",
        "share": 61
      },
      {
        "name": "Hyundai Transys",
        "share": 12
      },
      {
        "name": "Hanon Systems",
        "share": 10
      },
      {
        "name": "HL Mando",
        "share": 9
      },
      {
        "name": "Hyundai Wia",
        "share": 8
      }
    ],
    "market": {
      "label": "$542B",
      "trillion_usd": 0.542,
      "year": "2024"
    },
    "cagr": "≈6.6%"
  },
  "251020": {
    "gics": "251020",
    "industry_en": "Automobiles",
    "industry_ko": "자동차",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.2,
      "global": 0.1333,
      "scale": 0.4,
      "tech": 0.2667
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
      },
      {
        "name": "Stellantis",
        "share": 6
      },
      {
        "name": "BYD",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "name": "Hyundai",
        "share": 42
      },
      {
        "name": "Kia",
        "share": 30
      },
      {
        "name": "KG Mobility",
        "share": 8
      },
      {
        "ko": "수입차",
        "name": "Imports",
        "share": 6
      }
    ],
    "market": {
      "label": "$4.30T",
      "trillion_usd": 4.3,
      "year": "2024"
    },
    "cagr": "≈5.7%"
  },
  "252010": {
    "gics": "252010",
    "industry_en": "Household Durables",
    "industry_ko": "내구소비재",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.25,
      "global": 0,
      "scale": 0.75,
      "tech": 0
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
      },
      {
        "name": "NVR",
        "share": 7
      }
    ],
    "korea_firms": [
      {
        "name": "코웨이 (Coway)",
        "share": 35
      },
      {
        "ko": "매직",
        "name": "SK",
        "share": 18
      },
      {
        "ko": "전자",
        "name": "LG",
        "share": 13
      },
      {
        "name": "청호나이스",
        "share": 10
      }
    ],
    "market": {
      "label": "$1.35T",
      "trillion_usd": 1.35,
      "year": "2025"
    },
    "cagr": "~4.5%"
  },
  "252020": {
    "gics": "252020",
    "industry_en": "Leisure Products",
    "industry_ko": "레저용품",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.3333,
      "global": 0.4444,
      "scale": 0,
      "tech": 0.2222
    },
    "global_company": "LEGO Group",
    "korea_company": "Youngone",
    "global_firms": [
      {
        "name": "LEGO",
        "share": 43
      },
      {
        "name": "Mattel",
        "share": 18
      },
      {
        "name": "Hasbro",
        "share": 16
      },
      {
        "name": "Bandai Namco",
        "share": 15
      },
      {
        "name": "Spin Master",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "영원무역",
        "share": 66
      },
      {
        "name": "영원무역홀딩스",
        "share": 28
      },
      {
        "name": "삼익악기",
        "share": 3
      },
      {
        "name": "손오공",
        "share": 2
      },
      {
        "name": "알톤스포츠",
        "share": 1
      }
    ],
    "market": {
      "label": "$290B",
      "trillion_usd": 0.29,
      "year": "2025"
    },
    "cagr": "~2.24%"
  },
  "252030": {
    "gics": "252030",
    "industry_en": "Textiles, Apparel & Luxury Goods",
    "industry_ko": "섬유·의류·명품",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.3529,
      "global": 0.1176,
      "scale": 0.2941,
      "tech": 0.2353
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
      },
      {
        "name": "H&M",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung C&T Fashion",
        "share": 4
      },
      {
        "name": "F&F",
        "share": 4
      },
      {
        "name": "Shinsegae Int'l",
        "share": 3
      }
    ],
    "market": {
      "label": "$1.77T",
      "trillion_usd": 1.77,
      "year": "2024"
    },
    "cagr": "≈4.1%"
  },
  "253010": {
    "gics": "253010",
    "industry_en": "Hotels, Restaurants & Leisure",
    "industry_ko": "호텔·레스토랑·레저",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.6667,
      "global": 0,
      "scale": 0.3333,
      "tech": 0
    },
    "global_company": "Marriott International",
    "korea_company": "Hotel Shilla",
    "global_firms": [
      {
        "name": "Marriott",
        "share": 40
      },
      {
        "name": "Hilton",
        "share": 29
      },
      {
        "name": "Las Vegas Sands",
        "share": 13
      },
      {
        "name": "Oriental Land",
        "share": 10
      },
      {
        "name": "IHG",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "강원랜드",
        "share": 45
      },
      {
        "name": "호텔신라",
        "share": 26
      },
      {
        "name": "파라다이스",
        "share": 14
      },
      {
        "name": "그랜드코리아레저",
        "share": 8
      },
      {
        "name": "롯데관광개발",
        "share": 7
      }
    ],
    "market": {
      "label": "$5.21T",
      "trillion_usd": 5.21,
      "year": "2024"
    },
    "cagr": "~6%"
  },
  "253020": {
    "gics": "253020",
    "industry_en": "Diversified Consumer Services",
    "industry_ko": "종합 소비자 서비스",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.2941,
      "global": 0.1176,
      "scale": 0.0588,
      "tech": 0.5294
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
    ],
    "korea_firms": [
      {
        "name": "MegaStudyEdu",
        "share": 47
      },
      {
        "name": "Daesung",
        "share": 23
      },
      {
        "name": "Etoos",
        "share": 14
      }
    ],
    "market": {
      "label": "$3.49T",
      "trillion_usd": 3.49,
      "year": "2024"
    },
    "cagr": "≈6.9%"
  },
  "255010": {
    "gics": "255010",
    "industry_en": "Distributors",
    "industry_ko": "유통(소비재)",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.75,
      "tech": 0.25
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
      },
      {
        "name": "LKQ",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "name": "K Car",
        "share": 55
      },
      {
        "name": "Hyundai/Kia certified",
        "share": 30
      }
    ],
    "market": {
      "label": "$257B",
      "trillion_usd": 0.257,
      "year": "2024"
    },
    "cagr": "≈4.7%"
  },
  "255030": {
    "gics": "255030",
    "industry_en": "Broadline Retail",
    "industry_ko": "종합 소매",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0,
      "global": 0.6154,
      "scale": 0.0769,
      "tech": 0.3077
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
      },
      {
        "name": "JD.com",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "name": "Coupang",
        "share": 24
      },
      {
        "name": "Naver",
        "share": 21
      },
      {
        "name": "Gmarket",
        "share": 10
      },
      {
        "name": "11st",
        "share": 7
      }
    ],
    "market": {
      "label": "$6.1T",
      "trillion_usd": 6.1,
      "year": "2024"
    },
    "cagr": "≈8–9%"
  },
  "255040": {
    "gics": "255040",
    "industry_en": "Specialty Retail",
    "industry_ko": "전문 소매",
    "sector": "Consumer Discretionary",
    "ksf_weights": {
      "brand": 0.0833,
      "global": 0.4167,
      "scale": 0.5,
      "tech": 0
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
      },
      {
        "name": "Best Buy",
        "share": 3
      }
    ],
    "korea_firms": [
      {
        "name": "Lotte Hi-Mart",
        "share": 33
      },
      {
        "name": "Samsung/LG brand stores",
        "share": 25
      },
      {
        "name": "E-Land/Electro Mart",
        "share": 15
      },
      {
        "name": "Others (online etc.)",
        "share": 27
      }
    ],
    "market": {
      "label": "$2.05T",
      "trillion_usd": 2.05,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "301010": {
    "gics": "301010",
    "industry_en": "Consumer Staples Distribution & Retail",
    "industry_ko": "필수소비재 유통·소매",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.1176,
      "global": 0.1765,
      "scale": 0.7059,
      "tech": 0
    },
    "global_company": "Walmart",
    "korea_company": "E-Mart",
    "global_firms": [
      {
        "name": "Walmart",
        "share": 41
      },
      {
        "name": "Costco",
        "share": 23
      },
      {
        "name": "Schwarz (Lidl)",
        "share": 16
      },
      {
        "name": "Kroger",
        "share": 12
      },
      {
        "name": "Ahold Delhaize",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "ko": "리테일)",
        "name": "CU (BGF",
        "share": 33
      },
      {
        "ko": "리테일)",
        "name": "GS25 (GS",
        "share": 33
      },
      {
        "name": "세븐일레븐",
        "share": 21
      },
      {
        "name": "이마트24",
        "share": 9
      }
    ],
    "market": {
      "label": "$12.3T",
      "trillion_usd": 12.3,
      "year": "2024"
    },
    "cagr": "~3.2%"
  },
  "302010": {
    "gics": "302010",
    "industry_en": "Beverages",
    "industry_ko": "음료",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.2857,
      "global": 0.3333,
      "scale": 0.1429,
      "tech": 0.2381
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
      },
      {
        "name": "Diageo",
        "share": 7
      }
    ],
    "korea_firms": [
      {
        "name": "HiteJinro",
        "share": 33
      },
      {
        "name": "Oriental Brewery",
        "share": 23
      },
      {
        "name": "Lotte Chilsung",
        "share": 17
      }
    ],
    "market": {
      "label": "$1.80T",
      "trillion_usd": 1.8,
      "year": "2024"
    },
    "cagr": "≈1.7%"
  },
  "302020": {
    "gics": "302020",
    "industry_en": "Food Products",
    "industry_ko": "식품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.6667,
      "global": 0.1111,
      "scale": 0.2222,
      "tech": 0
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
      },
      {
        "name": "Kraft Heinz",
        "share": 1
      }
    ],
    "korea_firms": [
      {
        "name": "CJ CheilJedang",
        "share": 45
      },
      {
        "name": "Nongshim",
        "share": 20
      },
      {
        "name": "Ottogi",
        "share": 18
      },
      {
        "name": "Dongwon F&B",
        "share": 17
      }
    ],
    "market": {
      "label": "$2.58T",
      "trillion_usd": 2.58,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "302030": {
    "gics": "302030",
    "industry_en": "Tobacco",
    "industry_ko": "담배",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.1875,
      "global": 0.1875,
      "scale": 0.375,
      "tech": 0.25
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
      },
      {
        "name": "Japan Tobacco",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "KT&G",
        "share": 64
      },
      {
        "name": "Philip Morris Korea",
        "share": 26
      },
      {
        "name": "BAT Rothmans",
        "share": 10
      }
    ],
    "market": {
      "label": "$915B",
      "trillion_usd": 0.915,
      "year": "2024"
    },
    "cagr": "≈2.6%"
  },
  "303010": {
    "gics": "303010",
    "industry_en": "Household Products",
    "industry_ko": "생활용품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.381,
      "global": 0.1429,
      "scale": 0.1905,
      "tech": 0.2857
    },
    "global_company": "Procter & Gamble",
    "korea_company": "LG H&H",
    "global_firms": [
      {
        "name": "P&G",
        "share": 13
      },
      {
        "name": "Unilever",
        "share": 7
      },
      {
        "name": "Reckitt",
        "share": 5
      },
      {
        "name": "Henkel",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "LG H&H",
        "share": 37
      },
      {
        "name": "Amorepacific",
        "share": 13
      },
      {
        "name": "Aekyung",
        "share": 8
      }
    ],
    "market": {
      "label": "$193B",
      "trillion_usd": 0.193,
      "year": "2024"
    },
    "cagr": "≈5%"
  },
  "303020": {
    "gics": "303020",
    "industry_en": "Personal Care Products",
    "industry_ko": "퍼스널케어 제품",
    "sector": "Consumer Staples",
    "ksf_weights": {
      "brand": 0.4286,
      "global": 0.3333,
      "scale": 0,
      "tech": 0.2381
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
      },
      {
        "name": "Estée Lauder",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "Amorepacific",
        "share": 28
      },
      {
        "name": "LG H&H",
        "share": 19
      },
      {
        "name": "APR / indie",
        "share": 9
      }
    ],
    "market": {
      "label": "$558B",
      "trillion_usd": 0.558,
      "year": "2024"
    },
    "cagr": "≈4.4%"
  },
  "351010": {
    "gics": "351010",
    "industry_en": "Health Care Equipment & Supplies",
    "industry_ko": "의료기기 및 용품",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0,
      "global": 0.4706,
      "scale": 0.1765,
      "tech": 0.3529
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
      },
      {
        "name": "Abbott (devices)",
        "share": 3
      },
      {
        "name": "Boston Scientific",
        "share": 3
      }
    ],
    "korea_firms": [
      {
        "name": "Osstem Implant",
        "share": 31
      },
      {
        "name": "SD Biosensor",
        "share": 16
      },
      {
        "name": "Samsung Medison",
        "share": 13
      },
      {
        "name": "Dentium",
        "share": 9
      }
    ],
    "market": {
      "label": "$640B",
      "trillion_usd": 0.64,
      "year": "2024"
    },
    "cagr": "≈5.9%"
  },
  "351020": {
    "gics": "351020",
    "industry_en": "Health Care Providers & Services",
    "industry_ko": "헬스케어 제공·서비스",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0,
      "global": 0.1429,
      "scale": 0.7619,
      "tech": 0.0952
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
      },
      {
        "name": "Cigna",
        "share": 9
      }
    ],
    "korea_firms": [
      {
        "name": "McKesson",
        "share": 34
      },
      {
        "name": "Cencora",
        "share": 30
      },
      {
        "name": "Cardinal Health",
        "share": 28
      }
    ],
    "market": {
      "label": "$5.3T",
      "trillion_usd": 5.3,
      "year": "2024"
    },
    "cagr": "~5.8%"
  },
  "351030": {
    "gics": "351030",
    "industry_en": "Health Care Technology",
    "industry_ko": "헬스케어 기술",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0.1,
      "global": 0.5,
      "scale": 0.4,
      "tech": 0
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
      },
      {
        "name": "TruBridge (CPSI)",
        "share": 8
      },
      {
        "name": "Others (Altera…)",
        "share": 11
      }
    ],
    "korea_firms": [
      {
        "name": "유비케어(UbCare)",
        "share": 45
      },
      {
        "name": "비트컴퓨터",
        "share": 15
      },
      {
        "name": "이지스헬스케어",
        "share": 10
      },
      {
        "name": "포인트닉스",
        "share": 7
      }
    ],
    "market": {
      "label": "$870B",
      "trillion_usd": 0.87,
      "year": "2025"
    },
    "cagr": "~16%"
  },
  "352010": {
    "gics": "352010",
    "industry_en": "Biotechnology",
    "industry_ko": "바이오테크",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0,
      "global": 0.1818,
      "scale": 0.2727,
      "tech": 0.5455
    },
    "global_company": "Amgen",
    "korea_company": "Samsung Biologics",
    "global_firms": [
      {
        "name": "Amgen",
        "share": 36
      },
      {
        "name": "Gilead",
        "share": 29
      },
      {
        "name": "Regeneron",
        "share": 14
      },
      {
        "name": "Vertex",
        "share": 12
      },
      {
        "name": "Biogen",
        "share": 10
      }
    ],
    "korea_firms": [
      {
        "name": "삼성바이오로직스",
        "share": 44
      },
      {
        "name": "셀트리온",
        "share": 29
      },
      {
        "name": "알테오젠",
        "share": 18
      },
      {
        "ko": "바이오팜",
        "name": "SK",
        "share": 6
      },
      {
        "name": "HLB",
        "share": 3
      }
    ],
    "market": {
      "label": "$1.55T",
      "trillion_usd": 1.55,
      "year": "2024"
    },
    "cagr": "~13.9%"
  },
  "352020": {
    "gics": "352020",
    "industry_en": "Pharmaceuticals",
    "industry_ko": "제약",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0.25,
      "global": 0,
      "scale": 0.35,
      "tech": 0.4
    },
    "global_company": "Eli Lilly",
    "korea_company": "유한양행",
    "global_firms": [
      {
        "name": "Eli Lilly",
        "share": 41
      },
      {
        "name": "Johnson & Johnson",
        "share": 21
      },
      {
        "name": "AbbVie",
        "share": 17
      },
      {
        "name": "AstraZeneca",
        "share": 12
      },
      {
        "name": "Merck",
        "share": 9
      }
    ],
    "korea_firms": [
      {
        "name": "유한양행",
        "share": 33
      },
      {
        "name": "한미약품",
        "share": 27
      },
      {
        "ko": "녹십자",
        "name": "GC",
        "share": 20
      },
      {
        "name": "종근당",
        "share": 12
      },
      {
        "name": "대웅제약",
        "share": 8
      }
    ],
    "market": {
      "label": "$1.67T",
      "trillion_usd": 1.67,
      "year": "2024"
    },
    "cagr": "~6.3%"
  },
  "352030": {
    "gics": "352030",
    "industry_en": "Life Sciences Tools & Services",
    "industry_ko": "생명과학 도구 및 서비스",
    "sector": "Health Care",
    "ksf_weights": {
      "brand": 0,
      "global": 0.3846,
      "scale": 0.3846,
      "tech": 0.2308
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
      },
      {
        "name": "Lonza",
        "share": 9
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung Biologics",
        "share": 55
      },
      {
        "name": "SK pharmteco",
        "share": 18
      },
      {
        "name": "Lotte Biologics",
        "share": 12
      }
    ],
    "market": {
      "label": "$153.8B",
      "trillion_usd": 0.1538,
      "year": "2025"
    },
    "cagr": "≈6.9%"
  },
  "401010": {
    "gics": "401010",
    "industry_en": "Banks",
    "industry_ko": "은행",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 1,
      "tech": 0
    },
    "global_company": "JPMorgan Chase",
    "korea_company": "KB Financial Group",
    "global_firms": [
      {
        "name": "ICBC",
        "share": 27
      },
      {
        "ko": "중국농업은행",
        "name": "Agricultural Bank of China",
        "share": 24
      },
      {
        "ko": "중국건설은행",
        "name": "China Construction Bank",
        "share": 23
      },
      {
        "ko": "중국은행",
        "name": "Bank of China",
        "share": 19
      },
      {
        "name": "JPMorgan",
        "share": 7
      }
    ],
    "korea_firms": [
      {
        "name": "KB",
        "share": 33
      },
      {
        "ko": "신한",
        "name": "Shinhan",
        "share": 28
      },
      {
        "ko": "하나",
        "name": "Hana",
        "share": 22
      },
      {
        "ko": "우리",
        "name": "Woori",
        "share": 17
      }
    ],
    "market": {
      "label": "$8.7T",
      "trillion_usd": 8.7,
      "year": "2025"
    },
    "cagr": "≈5.5%"
  },
  "402010": {
    "gics": "402010",
    "industry_en": "Financial Services",
    "industry_ko": "금융 서비스",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0.2941,
      "global": 0.1176,
      "scale": 0.3529,
      "tech": 0.2353
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
      },
      {
        "name": "Discover / JCB",
        "share": 6
      }
    ],
    "korea_firms": [
      {
        "ko": "전자금융업자 (카카오페이·네이버페이)",
        "name": "E-finance firms (KakaoPay, NaverPay)",
        "share": 55
      },
      {
        "ko": "휴대폰 제조사 (삼성페이)",
        "name": "Phone makers (Samsung Pay)",
        "share": 24
      },
      {
        "ko": "은행·카드사",
        "name": "Banks & card firms",
        "share": 21
      }
    ],
    "market": {
      "label": "$135B",
      "trillion_usd": 0.135,
      "year": "2025"
    },
    "cagr": "~16–21%"
  },
  "402020": {
    "gics": "402020",
    "industry_en": "Consumer Finance",
    "industry_ko": "소비자금융",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0.1905,
      "global": 0.1905,
      "scale": 0.619,
      "tech": 0
    },
    "global_company": "American Express",
    "korea_company": "Shinhan Card",
    "global_firms": [
      {
        "name": "JPMorgan Chase",
        "share": 32
      },
      {
        "name": "American Express",
        "share": 28
      },
      {
        "name": "Citi",
        "share": 15
      },
      {
        "name": "Capital One",
        "share": 14
      },
      {
        "name": "Bank of America",
        "share": 11
      }
    ],
    "korea_firms": [
      {
        "name": "신한카드",
        "share": 24
      },
      {
        "name": "삼성카드",
        "share": 23
      },
      {
        "name": "현대카드",
        "share": 22
      },
      {
        "ko": "국민카드",
        "name": "KB",
        "share": 19
      },
      {
        "name": "롯데카드",
        "share": 12
      }
    ],
    "market": {
      "label": "$678B",
      "trillion_usd": 0.678,
      "year": "2025"
    },
    "cagr": "~8.7%"
  },
  "402030": {
    "gics": "402030",
    "industry_en": "Capital Markets",
    "industry_ko": "자본시장",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.2308,
      "scale": 0.4615,
      "tech": 0.3077
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
      },
      {
        "name": "State Street",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "Mirae Asset",
        "share": 30
      },
      {
        "name": "Korea Investment",
        "share": 22
      },
      {
        "name": "Samsung Securities",
        "share": 18
      }
    ],
    "market": {
      "label": "$135T",
      "trillion_usd": 135,
      "year": "2024"
    },
    "cagr": "≈6.2%"
  },
  "402040": {
    "gics": "402040",
    "industry_en": "Mortgage REITs",
    "industry_ko": "모기지 리츠",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0,
      "global": 1,
      "scale": 0,
      "tech": 0
    },
    "global_company": "Annaly Capital",
    "korea_company": "SK REIT",
    "global_firms": [
      {
        "name": "Annaly (NLY)",
        "share": 38
      },
      {
        "name": "AGNC Investment",
        "share": 28
      },
      {
        "name": "Starwood Property",
        "share": 15
      },
      {
        "name": "Rithm Capital",
        "share": 12
      },
      {
        "name": "Blackstone Mortgage",
        "share": 7
      }
    ],
    "korea_firms": [
      {
        "ko": "리츠",
        "name": "SK",
        "share": 30
      },
      {
        "name": "롯데리츠",
        "share": 26
      },
      {
        "ko": "켄달스퀘어리츠",
        "name": "ESR",
        "share": 20
      },
      {
        "name": "신한알파리츠",
        "share": 13
      },
      {
        "name": "제이알글로벌리츠",
        "share": 11
      }
    ],
    "market": {
      "label": "$73B",
      "trillion_usd": 0.073,
      "year": "2024"
    },
    "cagr": "~3–4%"
  },
  "403010": {
    "gics": "403010",
    "industry_en": "Insurance",
    "industry_ko": "보험",
    "sector": "Financials",
    "ksf_weights": {
      "brand": 0,
      "global": 0.6,
      "scale": 0,
      "tech": 0.4
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
      },
      {
        "name": "Berkshire (ins.)",
        "share": 2
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung Life",
        "share": 23
      },
      {
        "name": "Hanwha Life",
        "share": 14
      },
      {
        "name": "Kyobo Life",
        "share": 12
      }
    ],
    "market": {
      "label": "$7.3T",
      "trillion_usd": 7.3,
      "year": "2024"
    },
    "cagr": "≈2.3%"
  },
  "451020": {
    "gics": "451020",
    "industry_en": "IT Services",
    "industry_ko": "IT 서비스",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.5,
      "tech": 0.5
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
      },
      {
        "name": "Capgemini",
        "share": 1
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung SDS",
        "share": 52
      },
      {
        "name": "LG CNS",
        "share": 32
      },
      {
        "name": "SK AX",
        "share": 16
      }
    ],
    "market": {
      "label": "$1.85T",
      "trillion_usd": 1.85,
      "year": "2024"
    },
    "cagr": "≈8%"
  },
  "451030": {
    "gics": "451030",
    "industry_en": "Software",
    "industry_ko": "소프트웨어",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0.1667,
      "global": 0,
      "scale": 0.3333,
      "tech": 0.5
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
      },
      {
        "name": "Salesforce",
        "share": 3
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung SDS",
        "share": 30
      },
      {
        "name": "Naver",
        "share": 23
      },
      {
        "name": "LG CNS",
        "share": 13
      },
      {
        "name": "Kakao",
        "share": 12
      }
    ],
    "market": {
      "label": "$1.08T",
      "trillion_usd": 1.08,
      "year": "2024"
    },
    "cagr": "≈13–14%"
  },
  "452010": {
    "gics": "452010",
    "industry_en": "Communications Equipment",
    "industry_ko": "통신장비",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0.125,
      "global": 0,
      "scale": 0.0625,
      "tech": 0.8125
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
      },
      {
        "name": "ZTE",
        "share": 10
      },
      {
        "ko": "기타(시스코·시에나…)",
        "name": "Others (Cisco, Ciena…)",
        "share": 34
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung Electronics",
        "share": 45
      },
      {
        "ko": "외산(에릭슨·노키아)",
        "name": "Foreign (Ericsson/Nokia)",
        "share": 18
      },
      {
        "name": "HFR / DZS",
        "share": 10
      }
    ],
    "market": {
      "label": "$317B",
      "trillion_usd": 0.317,
      "year": "2024"
    },
    "cagr": "≈7.5%"
  },
  "452020": {
    "gics": "452020",
    "industry_en": "Technology Hardware, Storage & Peripherals",
    "industry_ko": "기술 하드웨어·스토리지·주변기기",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0.2778,
      "global": 0.3333,
      "scale": 0.2222,
      "tech": 0.1667
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
      },
      {
        "name": "vivo",
        "share": 8
      },
      {
        "name": "OPPO",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "삼성전자",
        "share": 56
      },
      {
        "ko": "하이닉스",
        "name": "SK",
        "share": 41
      },
      {
        "name": "삼성전기",
        "share": 2
      },
      {
        "ko": "이노텍",
        "name": "LG",
        "share": 1
      }
    ],
    "market": {
      "label": "$1.95T",
      "trillion_usd": 1.95,
      "year": "2024"
    },
    "cagr": "~9.4%"
  },
  "452030": {
    "gics": "452030",
    "industry_en": "Electronic Equipment, Instruments & Components",
    "industry_ko": "전자장비·계측·부품",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0,
      "global": 0.1,
      "scale": 0.3,
      "tech": 0.6
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
      },
      {
        "name": "Jabil",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "name": "LG Innotek",
        "share": 60
      },
      {
        "name": "Samsung Electro-Mech.",
        "share": 30
      },
      {
        "ko": "기타 국내",
        "name": "Others KR",
        "share": 7
      },
      {
        "ko": "기타",
        "name": "Misc.",
        "share": 3
      }
    ],
    "market": {
      "label": "$628B",
      "trillion_usd": 0.628,
      "year": "2024"
    },
    "cagr": "≈6.3%"
  },
  "453010": {
    "gics": "453010",
    "industry_en": "Semiconductors & Semiconductor Equipment",
    "industry_ko": "반도체·반도체장비",
    "sector": "Information Technology",
    "ksf_weights": {
      "brand": 0,
      "global": 0.3,
      "scale": 0.3,
      "tech": 0.4
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
      },
      {
        "name": "Broadcom",
        "share": 6
      }
    ],
    "korea_firms": [
      {
        "name": "Samsung Electronics",
        "share": 56
      },
      {
        "name": "SK hynix",
        "share": 43
      }
    ],
    "market": {
      "label": "$631B",
      "trillion_usd": 0.631,
      "year": "2024"
    },
    "cagr": "≈16–18%"
  },
  "501010": {
    "gics": "501010",
    "industry_en": "Diversified Telecommunication Services",
    "industry_ko": "종합 통신 서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "brand": 0.1667,
      "global": 0.5,
      "scale": 0.0833,
      "tech": 0.25
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
      },
      {
        "name": "NTT",
        "share": 11
      }
    ],
    "korea_firms": [
      {
        "name": "KT",
        "share": 40
      },
      {
        "name": "SK Broadband",
        "share": 29
      },
      {
        "name": "LG Uplus",
        "share": 21
      }
    ],
    "market": {
      "label": "$2.04T",
      "trillion_usd": 2.04,
      "year": "2024"
    },
    "cagr": "≈6.5%"
  },
  "501020": {
    "gics": "501020",
    "industry_en": "Wireless Telecommunication Services",
    "industry_ko": "무선 통신 서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "brand": 0.1429,
      "global": 0.5,
      "scale": 0.3571,
      "tech": 0
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
      },
      {
        "name": "Bharti Airtel",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "SK Telecom",
        "share": 40
      },
      {
        "name": "KT",
        "share": 22
      },
      {
        "name": "LG Uplus",
        "share": 21
      },
      {
        "name": "MVNO",
        "share": 17
      }
    ],
    "market": {
      "label": "$1.28T",
      "trillion_usd": 1.28,
      "year": "2024"
    },
    "cagr": "≈7.5%"
  },
  "502010": {
    "gics": "502010",
    "industry_en": "Media",
    "industry_ko": "미디어",
    "sector": "Communication Services",
    "ksf_weights": {
      "brand": 0.1429,
      "global": 0.0952,
      "scale": 0.1905,
      "tech": 0.5714
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
      },
      {
        "name": "Dentsu",
        "share": 11
      },
      {
        "name": "Others (Havas, etc.)",
        "share": 16
      }
    ],
    "korea_firms": [
      {
        "name": "Cheil Worldwide",
        "share": 38
      },
      {
        "name": "Innocean",
        "share": 26
      },
      {
        "name": "HS Ad",
        "share": 14
      }
    ],
    "market": {
      "label": "$1.09T",
      "trillion_usd": 1.09,
      "year": "2024"
    },
    "cagr": "≈8.5%"
  },
  "502020": {
    "gics": "502020",
    "industry_en": "Entertainment",
    "industry_ko": "엔터테인먼트",
    "sector": "Communication Services",
    "ksf_weights": {
      "brand": 0.6429,
      "global": 0,
      "scale": 0.3571,
      "tech": 0
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
      },
      {
        "name": "HBO Max",
        "share": 10
      }
    ],
    "korea_firms": [
      {
        "name": "Netflix",
        "share": 31
      },
      {
        "name": "Tving",
        "share": 16
      },
      {
        "name": "Coupang Play",
        "share": 13
      },
      {
        "name": "Wavve",
        "share": 11
      }
    ],
    "market": {
      "label": "$2.9T",
      "trillion_usd": 2.9,
      "year": "2024"
    },
    "cagr": "≈3.7%"
  },
  "502030": {
    "gics": "502030",
    "industry_en": "Interactive Media & Services",
    "industry_ko": "인터랙티브 미디어·서비스",
    "sector": "Communication Services",
    "ksf_weights": {
      "brand": 0.0625,
      "global": 0,
      "scale": 0.375,
      "tech": 0.5625
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
      },
      {
        "name": "ByteDance",
        "share": 7.9
      }
    ],
    "korea_firms": [
      {
        "name": "NAVER",
        "share": 62.9
      },
      {
        "name": "Google",
        "share": 29.6
      },
      {
        "name": "Bing",
        "share": 3.1
      },
      {
        "name": "Daum",
        "share": 2.9
      }
    ],
    "market": {
      "label": "$655B",
      "trillion_usd": 0.655,
      "year": "2024"
    },
    "cagr": "≈6–8%"
  },
  "551010": {
    "gics": "551010",
    "industry_en": "Electric Utilities",
    "industry_ko": "전력 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "brand": 0,
      "global": 0.4,
      "scale": 0.3333,
      "tech": 0.2667
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
      },
      {
        "name": "Constellation",
        "share": 10
      },
      {
        "name": "Others (Southern, Duke…)",
        "share": 48
      }
    ],
    "korea_firms": [
      {
        "ko": "원자력(한수원)",
        "name": "Nuclear (KHNP)",
        "share": 32
      },
      {
        "ko": "가스/LNG",
        "name": "Gas/LNG",
        "share": 28
      },
      {
        "ko": "석탄",
        "name": "Coal",
        "share": 28
      },
      {
        "ko": "신재생",
        "name": "Renewables",
        "share": 11
      }
    ],
    "market": {
      "label": "$1.49T",
      "trillion_usd": 1.49,
      "year": "2025"
    },
    "cagr": "~3.0%"
  },
  "551020": {
    "gics": "551020",
    "industry_en": "Gas Utilities",
    "industry_ko": "가스 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "brand": 0,
      "global": 0.375,
      "scale": 0.5,
      "tech": 0.125
    },
    "global_company": "Atmos Energy",
    "korea_company": "Korea Gas Corp. (KOGAS)",
    "global_firms": [
      {
        "name": "Atmos Energy",
        "share": 42
      },
      {
        "name": "Tokyo Gas",
        "share": 20
      },
      {
        "name": "Italgas",
        "share": 16
      },
      {
        "name": "ENN Energy",
        "share": 13
      },
      {
        "name": "China Resources Gas",
        "share": 9
      }
    ],
    "korea_firms": [
      {
        "name": "한국가스공사",
        "share": 71
      },
      {
        "name": "삼천리",
        "share": 15
      },
      {
        "name": "서울가스",
        "share": 7
      },
      {
        "name": "대성에너지",
        "share": 5
      },
      {
        "name": "인천도시가스",
        "share": 2
      }
    ],
    "market": {
      "label": "$372B",
      "trillion_usd": 0.372,
      "year": "2024"
    },
    "cagr": "~2.8%"
  },
  "551030": {
    "gics": "551030",
    "industry_en": "Multi-Utilities",
    "industry_ko": "복합 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "brand": 0,
      "global": 0.5789,
      "scale": 0.3684,
      "tech": 0.0526
    },
    "global_company": "National Grid",
    "korea_company": "한국지역난방공사 (proxy)",
    "global_firms": [
      {
        "name": "National Grid",
        "share": 30
      },
      {
        "name": "Sempra",
        "share": 21
      },
      {
        "name": "Dominion Energy",
        "share": 20
      },
      {
        "name": "WEC Energy",
        "share": 16
      },
      {
        "name": "DTE Energy",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "ko": "한국전력(전기)",
        "name": "KEPCO (electric)",
        "share": 70
      },
      {
        "ko": "한국가스공사(가스)",
        "name": "KOGAS (gas)",
        "share": 20
      },
      {
        "ko": "지역난방공사(전기+열)",
        "name": "KDHC (elec+heat)",
        "share": 7
      }
    ],
    "market": {
      "label": "$6.66T",
      "trillion_usd": 6.66,
      "year": "2024"
    },
    "cagr": "~5.5%"
  },
  "551040": {
    "gics": "551040",
    "industry_en": "Water Utilities",
    "industry_ko": "물 유틸리티",
    "sector": "Utilities",
    "ksf_weights": {
      "brand": 0,
      "global": 0.5238,
      "scale": 0.4286,
      "tech": 0.0476
    },
    "global_company": "American Water Works",
    "korea_company": "K-water",
    "global_firms": [
      {
        "name": "Veolia",
        "share": 30
      },
      {
        "name": "American Water Works",
        "share": 25
      },
      {
        "name": "SABESP",
        "share": 19
      },
      {
        "name": "United Utilities",
        "share": 13
      },
      {
        "name": "Severn Trent",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "ko": "광역, bulk)K-water(광역상수도)",
        "name": "K-water (",
        "share": 48
      },
      {
        "ko": "서울·수도권 지방상수도",
        "name": "Seoul & metro municipal",
        "share": 30
      },
      {
        "ko": "소규모·농어촌 시설",
        "name": "Small / rural systems",
        "share": 7
      }
    ],
    "market": {
      "label": "$348B",
      "trillion_usd": 0.348,
      "year": "2024"
    },
    "cagr": "~6.5%"
  },
  "551050": {
    "gics": "551050",
    "industry_en": "Independent Power and Renewable Electricity Producers",
    "industry_ko": "민자·재생에너지 발전",
    "sector": "Utilities",
    "ksf_weights": {
      "brand": 0,
      "global": 0.3,
      "scale": 0.6,
      "tech": 0.1
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
      },
      {
        "name": "AES",
        "share": 5
      }
    ],
    "korea_firms": [
      {
        "ko": "한전·발전자회사",
        "name": "KEPCO + gencos",
        "share": 80
      },
      {
        "name": "SK E&S",
        "share": 10
      },
      {
        "name": "GS / Hanwha",
        "share": 6
      }
    ],
    "cagr": "≈15%"
  },
  "601010": {
    "gics": "601010",
    "industry_en": "Diversified REITs",
    "industry_ko": "종합 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0.3571,
      "scale": 0.5714,
      "tech": 0.0714
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
      },
      {
        "name": "Land Securities",
        "share": 13
      }
    ],
    "korea_firms": [
      {
        "name": "SK REIT",
        "share": 50
      },
      {
        "name": "Lotte REIT",
        "share": 35
      },
      {
        "name": "Koramco",
        "share": 15
      }
    ],
    "market": {
      "label": "$2.2T",
      "trillion_usd": 2.2,
      "year": "2024"
    },
    "cagr": "≈3%"
  },
  "601025": {
    "gics": "601025",
    "industry_en": "Industrial REITs",
    "industry_ko": "산업·물류 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.7778,
      "tech": 0.2222
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
      },
      {
        "name": "EastGroup",
        "share": 4
      }
    ],
    "korea_firms": [
      {
        "name": "ESR Kendall Square",
        "share": 85
      },
      {
        "name": "D&D Platform",
        "share": 10
      }
    ],
    "market": {
      "label": "$1.20T",
      "trillion_usd": 1.2,
      "year": "2024"
    },
    "cagr": "≈6%"
  },
  "601030": {
    "gics": "601030",
    "industry_en": "Hotel & Resort REITs",
    "industry_ko": "호텔·리조트 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0.3846,
      "global": 0,
      "scale": 0.6154,
      "tech": 0
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
      },
      {
        "name": "Park Hotels",
        "share": 8
      }
    ],
    "korea_firms": [
      {
        "name": "LOTTE REIT",
        "share": 80
      }
    ],
    "market": {
      "label": "$1.65T",
      "trillion_usd": 1.65,
      "year": "2024"
    },
    "cagr": "≈8%"
  },
  "601040": {
    "gics": "601040",
    "industry_en": "Office REITs",
    "industry_ko": "오피스 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.2727,
      "tech": 0.7273
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
      },
      {
        "name": "Kilroy",
        "share": 10
      },
      {
        "name": "SL Green",
        "share": 9
      }
    ],
    "korea_firms": [
      {
        "ko": "제이알글로벌리츠",
        "name": "JR Global REIT",
        "share": 40
      },
      {
        "ko": "신한알파리츠",
        "name": "Shinhan Alpha REIT",
        "share": 24
      },
      {
        "ko": "리츠",
        "name": "SK REIT",
        "share": 18
      }
    ],
    "market": {
      "label": "$42B",
      "trillion_usd": 0.042,
      "year": "2023"
    },
    "cagr": "≈9%"
  },
  "601050": {
    "gics": "601050",
    "industry_en": "Health Care REITs",
    "industry_ko": "헬스케어 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0,
      "scale": 0.6667,
      "tech": 0.3333
    },
    "global_company": "Welltower",
    "korea_company": "LH Dongtan Healthcare REIT (proxy)",
    "global_firms": [
      {
        "name": "Welltower",
        "share": 57
      },
      {
        "name": "Ventas",
        "share": 16
      },
      {
        "name": "Healthpeak",
        "share": 6
      },
      {
        "name": "Omega Healthcare",
        "share": 5
      },
      {
        "ko": "기타(AHR, CareTrust 등)",
        "name": "Others (AHR, CareTrust, etc.)",
        "share": 16
      }
    ],
    "korea_firms": [
      {
        "ko": "시니어 주거 세대(2,550)",
        "name": "Senior housing units (2,550)",
        "share": 74
      },
      {
        "ko": "오피스텔(874실)",
        "name": "Officetel units (874)",
        "share": 26
      }
    ],
    "market": {
      "label": "$944B",
      "trillion_usd": 0.944,
      "year": "2025"
    },
    "cagr": "≈4.5%"
  },
  "601060": {
    "gics": "601060",
    "industry_en": "Residential REITs",
    "industry_ko": "주거용 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0.0714,
      "scale": 0.5714,
      "tech": 0.3571
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
      },
      {
        "name": "Sun Communities",
        "share": 8
      },
      {
        "name": "Others (MAA, Essex…)",
        "share": 56
      }
    ],
    "korea_firms": [
      {
        "ko": "리츠",
        "name": "SK",
        "share": 19
      },
      {
        "name": "롯데리츠",
        "share": 14
      },
      {
        "ko": "켄달스퀘어리츠",
        "name": "ESR",
        "share": 11
      },
      {
        "name": "한화리츠",
        "share": 10
      }
    ],
    "market": {
      "label": "US$193B",
      "trillion_usd": 0.193,
      "year": ""
    },
    "cagr": "~2.3–3.1%"
  },
  "601070": {
    "gics": "601070",
    "industry_en": "Retail REITs",
    "industry_ko": "리테일 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0.125,
      "scale": 0.875,
      "tech": 0
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
      },
      {
        "name": "Kimco Realty",
        "share": 8
      },
      {
        "name": "Others (Federal Realty…)",
        "share": 32
      }
    ],
    "korea_firms": [
      {
        "ko": "리츠 (비리테일)",
        "name": "SK",
        "share": 17
      },
      {
        "name": "롯데리츠 (리테일)",
        "share": 11
      },
      {
        "ko": "켄달스퀘어리츠",
        "name": "ESR",
        "share": 11
      },
      {
        "name": "한화리츠",
        "share": 8
      }
    ],
    "market": {
      "label": "US$213B",
      "trillion_usd": 0.213,
      "year": ""
    },
    "cagr": "~4.0–5.1%"
  },
  "601080": {
    "gics": "601080",
    "industry_en": "Specialized REITs",
    "industry_ko": "특수 리츠",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0.4,
      "scale": 0.6,
      "tech": 0
    },
    "global_company": "American Tower",
    "korea_company": "SK REIT",
    "global_firms": [
      {
        "name": "Equinix",
        "share": 29
      },
      {
        "name": "American Tower",
        "share": 25
      },
      {
        "name": "Digital Realty",
        "share": 20
      },
      {
        "name": "Public Storage",
        "share": 16
      },
      {
        "name": "Crown Castle",
        "share": 10
      }
    ],
    "korea_firms": [
      {
        "ko": "리츠",
        "name": "SK",
        "share": 31
      },
      {
        "name": "롯데리츠",
        "share": 22
      },
      {
        "ko": "켄달스퀘어리츠",
        "name": "ESR",
        "share": 18
      },
      {
        "name": "한화리츠",
        "share": 16
      },
      {
        "name": "코람코라이프인프라리츠",
        "share": 13
      }
    ],
    "market": {
      "label": "$76.9B",
      "trillion_usd": 0.0769,
      "year": "2025"
    },
    "cagr": "~13%"
  },
  "602010": {
    "gics": "602010",
    "industry_en": "Real Estate Management & Development",
    "industry_ko": "부동산 관리·개발",
    "sector": "Real Estate",
    "ksf_weights": {
      "brand": 0,
      "global": 0.4545,
      "scale": 0.5455,
      "tech": 0
    },
    "global_company": "Sun Hung Kai Properties",
    "korea_company": "SK디앤디 (SK D&D)",
    "global_firms": [
      {
        "name": "Sun Hung Kai",
        "share": 28
      },
      {
        "name": "CBRE Group",
        "share": 23
      },
      {
        "name": "Mitsubishi Estate",
        "share": 17
      },
      {
        "name": "Mitsui Fudosan",
        "share": 16
      },
      {
        "name": "JLL",
        "share": 16
      }
    ],
    "korea_firms": [
      {
        "ko": "디앤디",
        "name": "SK",
        "share": 40
      },
      {
        "name": "한국자산신탁",
        "share": 30
      },
      {
        "name": "한국토지신탁",
        "share": 18
      },
      {
        "ko": "리츠",
        "name": "SK",
        "share": 9
      },
      {
        "name": "기타",
        "share": 3
      }
    ],
    "market": {
      "label": "$4.05T",
      "trillion_usd": 4.05,
      "year": "2024"
    },
    "cagr": "~7.1%"
  }
};
