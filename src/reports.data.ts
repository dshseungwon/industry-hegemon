// 자동 생성 스냅샷 — The Industry Brief 메타데이터 (dshseungwon/daily-industry-report).
// 출처: https://raw.githubusercontent.com/dshseungwon/daily-industry-report/main/reports.json
// gics별 최신 리포트만 유지. 갱신: reports.json을 다시 fetch해 재생성.
export interface BriefMeta {
  industry_en: string; industry_ko: string; sector: string; gics: string;
  global_company: string; korea_company: string; headline_ko: string; file: string;
}
export const REPORT_BASE = "https://dshseungwon.github.io/daily-industry-report/";
export const reportUrl = (m: BriefMeta) => REPORT_BASE + m.file;
export const BRIEFS: BriefMeta[] = [
  {
    "industry_en": "Diversified Telecommunication Services",
    "industry_ko": "종합 통신 서비스",
    "sector": "Communication Services",
    "gics": "501010",
    "global_company": "Deutsche Telekom",
    "korea_company": "KT Corporation",
    "headline_ko": "종합 통신사들이 단순 연결에서 AI·데이터센터 인프라로 무게중심을 옮기고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_501010_diversified-telecom.html"
  },
  {
    "industry_en": "Entertainment",
    "industry_ko": "엔터테인먼트",
    "sector": "Communication Services",
    "gics": "502020",
    "global_company": "Netflix",
    "korea_company": "KRAFTON",
    "headline_ko": "엔터테인먼트의 이익은 대형 스트리밍 플랫폼과 IP 보유 기업으로 쏠리고 있습니다. 넷플릭스는 광고·라이브·게임으로 무게를 옮기고 파라마운트-WBD 합병이 할리우드를 재편하는 가운데, 한국의 게임·K팝 선두 기업들은 소수 IP에 기댄 채 사상 최대 매출을 올렸습니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_502020_entertainment.html"
  },
  {
    "industry_en": "Interactive Media & Services",
    "industry_ko": "인터랙티브 미디어·서비스",
    "sector": "Communication Services",
    "gics": "502030",
    "global_company": "Alphabet (Google)",
    "korea_company": "NAVER",
    "headline_ko": "검색·소셜 플랫폼이 글로벌 광고의 약 73%를 가져가는 가운데, 경쟁의 축은 이제 AI 답변으로 옮겨가고 있습니다. 시가총액 4조 달러를 넘어선 알파벳이 세계 1위이며, 국내 검색 점유율 63%의 네이버가 카카오에 맞서 안방 시장을 지키고 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_502030_interactive-media-services.html"
  },
  {
    "industry_en": "Media",
    "industry_ko": "미디어",
    "sector": "Communication Services",
    "gics": "502010",
    "global_company": "Omnicom",
    "korea_company": "Cheil Worldwide",
    "headline_ko": "광고 시장은 1조 달러를 넘어섰으나 성장은 모두 디지털에 쏠리고, 옴니콤-IPG 합병으로 규모가 통합되며 이제 데이터와 AI가 마진을 가릅니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_502010_media.html"
  },
  {
    "industry_en": "Wireless Telecommunication Services",
    "industry_ko": "무선 통신 서비스",
    "sector": "Communication Services",
    "gics": "501020",
    "global_company": "China Mobile",
    "korea_company": "SK Telecom",
    "headline_ko": "포화된 자본집약 통신사들이 ARPU 정체와 보안의 사활화 속에 AI·데이터센터로 전환하고 있습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_501020_wireless-telecom.html"
  },
  {
    "industry_en": "Automobile Components",
    "industry_ko": "자동차 부품",
    "sector": "Consumer Discretionary",
    "gics": "251010",
    "global_company": "Bosch (Mobility)",
    "korea_company": "Hyundai Mobis",
    "headline_ko": "자동차 부품은 약 5,800억 달러 규모 시장이나, 판매 정체와 미국의 15~25% 관세, 전기차 전환 지연이라는 삼중고를 겪고 있습니다. 가치는 전장·소프트웨어·애프터마켓으로 이동 중이며, 비용 구조를 정비한 기업 위주로 재편이 진행되고 있습니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_251010_automobile-components.html"
  },
  {
    "industry_en": "Automobiles",
    "industry_ko": "자동차",
    "sector": "Consumer Discretionary",
    "gics": "251020",
    "global_company": "Tesla",
    "korea_company": "Hyundai Motor",
    "headline_ko": "2025년 글로벌 자동차 판매가 약 9,170만 대로 사상 최대를 기록한 가운데, 전기차 전환은 지역별로 크게 엇갈리고 있습니다. 판매량 1위는 토요타지만 시가총액 1위는 테슬라이며, 현대자동차가 한국을 대표하고 현대차그룹은 판매 대수 기준 세계 3위에 올라 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_251020_automobiles.html"
  },
  {
    "industry_en": "Broadline Retail",
    "industry_ko": "종합 소매",
    "sector": "Consumer Discretionary",
    "gics": "255030",
    "global_company": "Amazon",
    "korea_company": "Coupang",
    "headline_ko": "박한 마진의 규모 경쟁이 AI 설비투자 경쟁과 맞물리고, 국경 간 초저가 업체는 관세 허점을 잃었습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_255030_broadline-retail.html"
  },
  {
    "industry_en": "Distributors",
    "industry_ko": "유통(소비재)",
    "sector": "Consumer Discretionary",
    "gics": "255010",
    "global_company": "Genuine Parts Company",
    "korea_company": "K Car",
    "headline_ko": "관세와 수리권이 유통 구조를 재편하는 가운데, 1위 기업이 둘로 분할되고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_255010_distributors.html"
  },
  {
    "industry_en": "Diversified Consumer Services",
    "industry_ko": "종합 소비자 서비스",
    "sector": "Consumer Discretionary",
    "gics": "253010",
    "global_company": "Service Corporation International",
    "korea_company": "MegaStudyEdu",
    "headline_ko": "AI 튜터링과 인구 감소가 교육·소비자 서비스를 함께 재편하고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_253010_diversified-consumer-services.html"
  },
  {
    "industry_en": "Household Durables",
    "industry_ko": "내구소비재",
    "sector": "Consumer Discretionary",
    "gics": "252010",
    "global_company": "D.R. Horton",
    "korea_company": "Coway",
    "headline_ko": "규모 선두 D.R. Horton이 내구재 1위이나, 높은 모기지 금리가 주택건설사를 압박하고 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_252010_household-durables.html"
  },
  {
    "industry_en": "Specialty Retail",
    "industry_ko": "전문 소매",
    "sector": "Consumer Discretionary",
    "gics": "255040",
    "global_company": "Home Depot",
    "korea_company": "Lotte Hi-Mart",
    "headline_ko": "관세와 가성비를 좇는 소비자가 전문 소매업을 재편하는 가운데, 규모와 프로·서비스 역량이 승부를 가릅니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_255040_specialty-retail.html"
  },
  {
    "industry_en": "Textiles, Apparel & Luxury Goods",
    "industry_ko": "섬유·의류·명품",
    "sector": "Consumer Discretionary",
    "gics": "252030",
    "global_company": "LVMH",
    "korea_company": "Youngone",
    "headline_ko": "명품 슈퍼사이클은 막을 내렸고, 이제 브랜드 욕망과 관세가 승자를 가릅니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_252030_textiles-apparel-luxury.html"
  },
  {
    "industry_en": "Beverages",
    "industry_ko": "음료",
    "sector": "Consumer Staples",
    "gics": "302010",
    "global_company": "Coca-Cola",
    "korea_company": "Lotte Chilsung",
    "headline_ko": "물량 정체 속에 음료업계는 가격·믹스·건강 수요로 성장을 모색하고 있습니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_302010_beverages.html"
  },
  {
    "industry_en": "Consumer Staples Distribution & Retail",
    "industry_ko": "필수소비재 유통·소매",
    "sector": "Consumer Staples",
    "gics": "301010",
    "global_company": "Walmart",
    "korea_company": "Emart",
    "headline_ko": "얇은 식료품 마진의 성패가 이제 데이터·멤버십·이커머스에 달려 있습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_301010_consumer-staples-retail.html"
  },
  {
    "industry_en": "Food Products",
    "industry_ko": "식품",
    "sector": "Consumer Staples",
    "gics": "302020",
    "global_company": "Nestlé",
    "korea_company": "CJ CheilJedang",
    "headline_ko": "원자재 인플레이션과 GLP-1이 수요를 재편하면서, 거대 식품사들이 분할에 나서고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_302020_food-products.html"
  },
  {
    "industry_en": "Household Products",
    "industry_ko": "생활용품",
    "sector": "Consumer Staples",
    "gics": "303010",
    "global_company": "Procter & Gamble",
    "korea_company": "LG H&H",
    "headline_ko": "성숙한 브랜드 중심 카테고리가 PB와 관세에 마진을 압박받으며, 가격을 양보하고 물량으로 돌아서고 있습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_303010_household-products.html"
  },
  {
    "industry_en": "Personal Care Products",
    "industry_ko": "퍼스널케어 제품",
    "sector": "Consumer Staples",
    "gics": "303020",
    "global_company": "L'Oréal",
    "korea_company": "Amorepacific",
    "headline_ko": "브랜드가 주도하는 5,820억 달러 시장이 약 4.4% 성장하며 미국과 K뷰티 수출로 재편되는 가운데, 로레알은 더마뷰티에 집중하고 아모레퍼시픽은 중국 의존에서 벗어나는 데 주력하고 있습니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_303020_personal-care-products.html"
  },
  {
    "industry_en": "Tobacco",
    "industry_ko": "담배",
    "sector": "Consumer Staples",
    "gics": "302030",
    "global_company": "Philip Morris International",
    "korea_company": "KT&G",
    "headline_ko": "세대별 판매 금지가 임박한 가운데, 비연소 제품이 마진 기여 사업으로 전환되고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_302030_tobacco.html"
  },
  {
    "industry_en": "Energy Equipment & Services",
    "industry_ko": "에너지 장비 및 서비스",
    "sector": "Energy",
    "gics": "101010",
    "global_company": "SLB",
    "korea_company": "Hanwha Ocean (proxy)",
    "headline_ko": "에너지 장비·서비스 업계는 투자 정체 구간을 인수합병으로 돌파하고 있습니다. 시추 용선료가 바닥을 다지는 사이 SLB, 베이커휴즈, 사이펨7은 생산·LNG·디지털에서 성장을 사들이고 있는 것으로 파악됩니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_101010_energy-equipment-services.html"
  },
  {
    "industry_en": "Oil, Gas & Consumable Fuels",
    "industry_ko": "석유·가스·소비연료",
    "sector": "Energy",
    "gics": "101020",
    "global_company": "Saudi Aramco",
    "korea_company": "SK Innovation",
    "headline_ko": "석유·가스는 OPEC+와 2026년 호르무즈 해협 공급 충격에 좌우되는 약 8조 달러 규모의 복합 산업입니다. 사우디 아람코가 시가총액 기준 세계 1위이며, 상류 부문이 없는 한국은 정유사 SK이노베이션을 통해 하류에서 경쟁하고 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_101020_oil-gas-consumable-fuels.html"
  },
  {
    "industry_en": "Banks",
    "industry_ko": "은행",
    "sector": "Financials",
    "gics": "401010",
    "global_company": "JPMorgan Chase",
    "korea_company": "KB Financial Group",
    "headline_ko": "은행업은 2025년 매출 약 7.3조 달러로 경제 내 최대 이익 풀이지만, 금리 상승의 순풍은 약해지고 있습니다. 시가총액 기준 세계 1위는 JP모건, 한국 1위는 KB금융이며, 두 회사 모두 바젤 규제 완화와 한국의 밸류업 흐름 속에 사상 최대 규모의 주주환원을 진행하고 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_401010_banks.html"
  },
  {
    "industry_en": "Capital Markets",
    "industry_ko": "자본시장",
    "sector": "Financials",
    "gics": "402030",
    "global_company": "BlackRock",
    "korea_company": "Mirae Asset",
    "headline_ko": "패시브의 규모와 사모시장이 수수료 풀을 둘로 가르고 있습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_402030_capital-markets.html"
  },
  {
    "industry_en": "Financial Services",
    "industry_ko": "금융 서비스",
    "sector": "Financials",
    "gics": "402010",
    "global_company": "Visa",
    "korea_company": "Samsung Card",
    "headline_ko": "Visa·Mastercard 복점이 복리로 성장하는 가운데, 스테이블코인과 규제가 수취율을 압박하고 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_402010_financial-services.html"
  },
  {
    "industry_en": "Insurance",
    "industry_ko": "보험",
    "sector": "Financials",
    "gics": "403010",
    "global_company": "Allianz",
    "korea_company": "Samsung Life",
    "headline_ko": "고금리 장기화가 운용수익을 키우는 한편, 재해 위험은 계속 커지고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_403010_insurance.html"
  },
  {
    "industry_en": "Mortgage REITs",
    "industry_ko": "모기지 리츠",
    "sector": "Financials",
    "gics": "402040",
    "global_company": "Annaly Capital",
    "korea_company": "KHFC (proxy)",
    "headline_ko": "연준의 금리 인하가 수익률 곡선을 가파르게 하며 레버리지 스프레드 사업을 끌어올리고 있습니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_402040_mortgage-reits.html"
  },
  {
    "industry_en": "Health Care Equipment & Supplies",
    "industry_ko": "의료기기 및 용품",
    "sector": "Health Care",
    "gics": "351010",
    "global_company": "Medtronic",
    "korea_company": "Osstem Implant",
    "headline_ko": "의료기기 수요는 연 6% 안팎으로 꾸준히 늘고 있습니다만, 2026년의 승부처는 정책입니다. 미국 기기 관세, EU 규제 완화, 중국식 대량조달이 변수이며, 고성장 포트폴리오와 지역화된 공급망을 갖춘 기업이 유리할 것으로 보입니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_351010_health-care-equipment-supplies.html"
  },
  {
    "industry_en": "Health Care Providers & Services",
    "industry_ko": "헬스케어 제공·서비스",
    "sector": "Health Care",
    "gics": "351020",
    "global_company": "UnitedHealth Group",
    "korea_company": "SD Biosensor (proxy)",
    "headline_ko": "미국 중심의 관리의료·유통 산업은 2026년 더 어려운 국면을 맞고 있습니다. 시가총액 세계 1위인 유나이티드헬스는 법무부 조사와 의료비 급등을 헤쳐 나가고 있으며, 단일 보험자(건강보험공단) 체계의 한국에는 상장 대등 기업이 없어 SD바이오센서를 작은 대용 기업으로만 제시합니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_351020_health-care-providers-services.html"
  },
  {
    "industry_en": "Health Care Technology",
    "industry_ko": "헬스케어 기술",
    "sector": "Health Care",
    "gics": "351030",
    "global_company": "Veeva Systems",
    "korea_company": "Lunit",
    "headline_ko": "헬스케어 기술은 AI와 상호운용성 규제 속에서 연 약 16% 성장하며 가치 구조를 재편하고 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_351030_health-care-technology.html"
  },
  {
    "industry_en": "Life Sciences Tools & Services",
    "industry_ko": "생명과학 도구 및 서비스",
    "sector": "Health Care",
    "gics": "352030",
    "global_company": "Thermo Fisher Scientific",
    "korea_company": "Samsung Biologics",
    "headline_ko": "생명과학 도구·서비스는 약 1,540억 달러 규모의 인프라 시장입니다. 바이오공정 회복과 함께 재고 조정 국면을 벗어나고 있으며, 생물보안법(BIOSECURE Act) 시행으로 위탁생산 수요가 비중국·미국 현지 공급사로 옮겨가고 있습니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_352030_life-sciences-tools-services.html"
  },
  {
    "industry_en": "Aerospace & Defense",
    "industry_ko": "항공우주·방위",
    "sector": "Industrials",
    "gics": "201010",
    "global_company": "Lockheed Martin",
    "korea_company": "Hanwha Aerospace",
    "headline_ko": "재무장 흐름이 다년간의 방산 상승 사이클을 떠받치는 가운데, 한국의 방산 수출이 급증하고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_201010_aerospace-defense.html"
  },
  {
    "industry_en": "Air Freight & Logistics",
    "industry_ko": "항공화물·물류",
    "sector": "Industrials",
    "gics": "203010",
    "global_company": "FedEx",
    "korea_company": "CJ Logistics",
    "headline_ko": "항공화물은 2025년 사상 최대 물동량을 기록했습니다. 다만 소액 면세 제도가 사라지면서 물류 흐름이 아시아-미국에서 아시아-유럽으로 옮겨가고 있으며, 통관 역량을 갖춘 통합 물류사가 유리해진 상황입니다.",
    "file": "reports/2026-06-10/industry-report_2026-06-10_203010_air-freight-logistics.html"
  },
  {
    "industry_en": "Building Products",
    "industry_ko": "건축자재",
    "sector": "Industrials",
    "gics": "201020",
    "global_company": "Saint-Gobain",
    "korea_company": "KCC",
    "headline_ko": "관세와 고금리가 분절된 시장을 압박하는 가운데, 업계는 저탄소·고사양 제품으로 무게중심을 옮기고 있습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_201020_building-products.html"
  },
  {
    "industry_en": "Commercial Services & Supplies",
    "industry_ko": "상업 서비스·용품",
    "sector": "Industrials",
    "gics": "202010",
    "global_company": "Waste Management",
    "korea_company": "S-1 Corporation",
    "headline_ko": "인건비와 규제가 옥죄는 가운데, 가격 결정력과 통합이 폐기물·시설관리 대형사를 끌어올리고 있습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_202010_commercial-services-supplies.html"
  },
  {
    "industry_en": "Construction & Engineering",
    "industry_ko": "건설·엔지니어링",
    "sector": "Industrials",
    "gics": "201030",
    "global_company": "China State Construction Engineering",
    "korea_company": "Hyundai E&C",
    "headline_ko": "거대하나 분절된 건설 시장은 2029년 약 20조 달러를 향해 연 5.6% 성장하지만, 얇은 시공 마진이 글로벌 1위 CSCEC마저 압박하고 한국 현대건설을 2001년 이래 첫 영업적자로 내몰았습니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_201030_construction-engineering.html"
  },
  {
    "industry_en": "Electrical Equipment",
    "industry_ko": "전기장비",
    "sector": "Industrials",
    "gics": "201040",
    "global_company": "Schneider Electric",
    "korea_company": "Hyosung Heavy",
    "headline_ko": "AI 데이터센터와 전력망 투자가 변압기를 가장 희소한 자산으로 만들었습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_201040_electrical-equipment.html"
  },
  {
    "industry_en": "Industrial Conglomerates",
    "industry_ko": "복합기업(산업재)",
    "sector": "Industrials",
    "gics": "201050",
    "global_company": "Siemens AG",
    "korea_company": "Samsung C&T",
    "headline_ko": "행동주의와 상법 개정이 복합기업 할인을 허무는 국면입니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_201050_industrial-conglomerates.html"
  },
  {
    "industry_en": "Machinery",
    "industry_ko": "기계",
    "sector": "Industrials",
    "gics": "201060",
    "global_company": "Caterpillar",
    "korea_company": "Doosan Bobcat",
    "headline_ko": "AI 데이터센터의 전력 수요가 기계 산업의 새로운 성장 엔진으로 부상하고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_201060_machinery.html"
  },
  {
    "industry_en": "Marine Transportation",
    "industry_ko": "해상운송",
    "sector": "Industrials",
    "gics": "203030",
    "global_company": "MSC",
    "korea_company": "HMM",
    "headline_ko": "홍해 우회로 해상운임이 반등했으나, 역대급 수주잔고가 공급 과잉 위험으로 남아 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_203030_marine-transportation.html"
  },
  {
    "industry_en": "Passenger Airlines",
    "industry_ko": "여객 항공",
    "sector": "Industrials",
    "gics": "203020",
    "global_company": "Delta Air Lines",
    "korea_company": "Korean Air",
    "headline_ko": "여객 항공은 사상 최대 수송량을 회복했으나, 2026년 6월 항공유 가격 급등으로 IATA의 2026년 이익 전망이 230억 달러로 반토막 났습니다. 시가총액 기준 글로벌 1위는 델타항공이며, 대한항공은 아시아나 인수를 마무리하며 통합 단일 항공사로 나아가고 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_203020_passenger-airlines.html"
  },
  {
    "industry_en": "Professional Services",
    "industry_ko": "전문 서비스",
    "sector": "Industrials",
    "gics": "202020",
    "global_company": "ADP",
    "korea_company": "Saramin",
    "headline_ko": "AI가 전문 서비스를 고마진 데이터 사업과 압박받는 인력 사업으로 가르는 가운데, 글로벌은 ADP가 선두이며 한국의 가장 가까운 상장 대용주는 사람인입니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_202020_professional-services.html"
  },
  {
    "industry_en": "Trading Companies & Distributors",
    "industry_ko": "종합상사·유통",
    "sector": "Industrials",
    "gics": "201070",
    "global_company": "Mitsubishi Corporation",
    "korea_company": "POSCO International",
    "headline_ko": "버핏의 베팅과 에너지 전환이 종합상사 모델을 다시 짜고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_201070_trading-companies-distributors.html"
  },
  {
    "industry_en": "Communications Equipment",
    "industry_ko": "통신장비",
    "sector": "Information Technology",
    "gics": "452010",
    "global_company": "Cisco Systems",
    "korea_company": "Samsung Electronics",
    "headline_ko": "AI 데이터센터 네트워킹은 호황인 반면 통신사 RAN은 정체돼 있고 지정학이 장비업체 지형을 재편하는 가운데, 매출은 시스코가, 통신사 점유율은 화웨이가 선두입니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_452010_communications-equipment.html"
  },
  {
    "industry_en": "Electronic Equipment, Instruments & Components",
    "industry_ko": "전자장비·계측·부품",
    "sector": "Information Technology",
    "gics": "452030",
    "global_company": "Hon Hai (Foxconn)",
    "korea_company": "LG Innotek",
    "headline_ko": "AI 서버 증설이 부품·EMS 가치사슬을 재편하고 있습니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_452030_electronic-equipment-components.html"
  },
  {
    "industry_en": "IT Services",
    "industry_ko": "IT 서비스",
    "sector": "Information Technology",
    "gics": "451020",
    "global_company": "Accenture",
    "korea_company": "Samsung SDS",
    "headline_ko": "생성형 AI가 IT 서비스의 성장 엔진이자 파괴 요인으로 동시에 작용하고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_451020_it-services.html"
  },
  {
    "industry_en": "Semiconductors & Semiconductor Equipment",
    "industry_ko": "반도체·반도체장비",
    "sector": "Information Technology",
    "gics": "453010",
    "global_company": "NVIDIA",
    "korea_company": "Samsung Electronics",
    "headline_ko": "AI 슈퍼사이클이 사상 최대 메모리 부족과 1조 달러 반도체 시장을 견인하고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_453010_semiconductors.html"
  },
  {
    "industry_en": "Software",
    "industry_ko": "소프트웨어",
    "sector": "Information Technology",
    "gics": "451030",
    "global_company": "Microsoft",
    "korea_company": "Samsung SDS",
    "headline_ko": "고마진·고성장 시장의 성패가 이제 AI 설비투자의 수익화에 달려 있습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_451030_software.html"
  },
  {
    "industry_en": "Technology Hardware, Storage & Peripherals",
    "industry_ko": "기술 하드웨어·스토리지·주변기기",
    "sector": "Information Technology",
    "gics": "452020",
    "global_company": "Apple",
    "korea_company": "Samsung Electronics",
    "headline_ko": "AI발 메모리 부족이 반도체를 수익의 중심으로, 완제품을 희생양으로 만들었습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_452020_technology-hardware.html"
  },
  {
    "industry_en": "Chemicals",
    "industry_ko": "화학",
    "sector": "Materials",
    "gics": "151010",
    "global_company": "BASF SE",
    "korea_company": "LG Chem",
    "headline_ko": "중국발 공급과잉이 화학 산업의 깊은 다운사이클을 몰고 와, 생존 기업은 스페셜티 소재로 무게중심을 옮기고 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_151010_chemicals.html"
  },
  {
    "industry_en": "Containers & Packaging",
    "industry_ko": "용기·포장",
    "sector": "Materials",
    "gics": "151030",
    "global_company": "Smurfit WestRock",
    "korea_company": "Dongwon Systems",
    "headline_ko": "초대형 인수와 EU 포장 규제가 파편화된 산업을 재편하고 있습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_151030_containers-packaging.html"
  },
  {
    "industry_en": "Metals & Mining",
    "industry_ko": "금속·광업",
    "sector": "Materials",
    "gics": "151040",
    "global_company": "BHP Group",
    "korea_company": "Korea Zinc",
    "headline_ko": "구리 슈퍼사이클과 사상 최고치 금값이 광업의 수익 구조를 다시 짜고 있습니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_151040_metals-mining.html"
  },
  {
    "industry_en": "Paper & Forest Products",
    "industry_ko": "제지·임산물",
    "sector": "Materials",
    "gics": "151050",
    "global_company": "Smurfit WestRock",
    "korea_company": "Hansol Paper",
    "headline_ko": "펄프 가격 급락이 제지사를 압박하는 와중에도, 플라스틱 규제가 종이 포장 수요를 끌어올리고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_151050_paper-forest-products.html"
  },
  {
    "industry_en": "Diversified REITs",
    "industry_ko": "종합 리츠",
    "sector": "Real Estate",
    "gics": "601010",
    "global_company": "W.P. Carey",
    "korea_company": "SK REIT",
    "headline_ko": "오피스가 발목을 잡는 가운데, 금리 인하와 자본 재배치가 종합 리츠를 떠받치고 있습니다.",
    "file": "reports/2026-06-06/industry-report_2026-06-06_601010_diversified-reits.html"
  },
  {
    "industry_en": "Hotel & Resort REITs",
    "industry_ko": "호텔·리조트 리츠",
    "sector": "Real Estate",
    "gics": "601030",
    "global_company": "Host Hotels & Resorts",
    "korea_company": "Hotel Shilla (proxy)",
    "headline_ko": "순자산가치 할인과 고금리가 인수 전략을 멈춰 세우고, RevPAR 성장세는 둔화 국면에 들어섰습니다.",
    "file": "reports/2026-06-08/industry-report_2026-06-08_601030_hotel-resort-reits.html"
  },
  {
    "industry_en": "Industrial REITs",
    "industry_ko": "산업·물류 리츠",
    "sector": "Real Estate",
    "gics": "601025",
    "global_company": "Prologis",
    "korea_company": "ESR Kendall Square REIT",
    "headline_ko": "수요가 정상화되는 가운데, 물류 리츠가 데이터센터와 전력으로 방향을 틀고 있습니다.",
    "file": "reports/2026-06-07/industry-report_2026-06-07_601025_industrial-reits.html"
  },
  {
    "industry_en": "Office REITs",
    "industry_ko": "오피스 리츠",
    "sector": "Real Estate",
    "gics": "601040",
    "global_company": "BXP (Boston Properties)",
    "korea_company": "Shinhan Alpha REIT",
    "headline_ko": "오피스 리츠는 공실률 변곡점에 서 있으며, 트로피 빌딩은 회복세인 반면 범용 빌딩은 차환의 벽에 직면해 있습니다.",
    "file": "reports/2026-06-09/industry-report_2026-06-09_601040_office-reits.html"
  },
  {
    "industry_en": "Residential REITs",
    "industry_ko": "주거용 리츠",
    "sector": "Real Estate",
    "gics": "601060",
    "global_company": "AvalonBay Communities",
    "korea_company": "SK REIT (proxy)",
    "headline_ko": "미국 주거용 리츠는 임대료 상승이 바닥을 다지고 금리 인하가 시작되는 가운데 사상 최대 공급 물량을 소화하고 있습니다. 약 690억 달러 규모로 에쿼티 레지덴셜과 합병을 앞둔 아발론베이가 시가총액 1위이며, 한국에는 순수 주거용 리츠가 없어 SK리츠가 가장 가까운 상장 대용 기업으로 남아 있습니다.",
    "file": "reports/2026-06-11/industry-report_2026-06-11_601060_residential-reits.html"
  },
  {
    "industry_en": "Retail REITs",
    "industry_ko": "리테일 리츠",
    "sector": "Real Estate",
    "gics": "601070",
    "global_company": "Simon Property Group",
    "korea_company": "Lotte REIT",
    "headline_ko": "공급 부족이 우량 리테일 리츠를 끌어올리며, Simon과 순임대 선두 기업이 재평가되고 있습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_601070_retail-reits.html"
  },
  {
    "industry_en": "Electric Utilities",
    "industry_ko": "전력 유틸리티",
    "sector": "Utilities",
    "gics": "551010",
    "global_company": "NextEra Energy",
    "korea_company": "KEPCO",
    "headline_ko": "데이터센터 수요가 전력 유틸리티를 되살리며, NextEra와 Dominion이 초대형 합병에 나섰습니다.",
    "file": "reports/2026-06-12/industry-report_2026-06-12_551010_electric-utilities.html"
  },
  {
    "industry_en": "Independent Power & Renewable Electricity Producers",
    "industry_ko": "민자·재생에너지 발전",
    "sector": "Utilities",
    "gics": "551050",
    "global_company": "NextEra Energy",
    "korea_company": "KEPCO (proxy)",
    "headline_ko": "AI 데이터센터가 청정 전력의 최종 매수자로 떠오르고 있습니다.",
    "file": "reports/2026-06-05/industry-report_2026-06-05_551050_independent-power-renewables.html"
  },
  {
    "industry_en": "Water Utilities",
    "industry_ko": "수도 유틸리티",
    "sector": "Utilities",
    "gics": "551040",
    "global_company": "American Water Works",
    "korea_company": "K-water (proxy)",
    "headline_ko": "규제 대상인 수도 독점 사업은 요금기저가 늘어나는 만큼만 성장할 수 있습니다.",
    "file": "reports/2026-06-04/industry-report_2026-06-04_551040_water-utilities.html"
  }
];
