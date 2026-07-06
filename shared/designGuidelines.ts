// 街道設計準則框架：前端顯示 label/summary/principles（中文），
// 伺服器端把 brief（英文設計簡報）注入生成提示，讓改造遵循專業標準。
// 內容取材自 NACTO 城市街道設計指南、全球街道設計指南（GDCI）、
// 完整街道（Complete Streets）與人本交通等通用原則。
export interface DesignGuideline {
  id: string;
  label: string;
  summary: string;
  principles: string[];
  brief: string;
}

export const DESIGN_GUIDELINES: DesignGuideline[] = [
  {
    id: 'pedestrian',
    label: '人本交通・行人優先',
    summary: '以行人安全與舒適為核心，建立連續、無障礙的步行環境。',
    principles: [
      '人行道淨寬至少 2.5 公尺，連續不中斷',
      '路口設置行人庇護島與街角外推，縮短穿越距離',
      '無障礙坡道與導盲設施',
      '移除人行道上的違停與障礙物',
    ],
    brief:
      'Follow pedestrian-first street design standards (NACTO Urban Street Design Guide): provide continuous, unobstructed sidewalks with at least 2.5 meters of clear walking space and smooth accessible paving; add curb extensions and pedestrian refuge islands at crossings to shorten crossing distances; include accessible curb ramps and tactile guiding strips; remove cars, scooters and obstacles parked on sidewalks; use high-visibility zebra crosswalks.',
  },
  {
    id: 'traffic-calming',
    label: '交通寧靜化',
    summary: '透過幾何設計降低車速，打造安全的生活街區。',
    principles: [
      '車道縮減至 3.0 公尺，抑制車速',
      '設置減速平台、抬升式路口與行穿線',
      '縮小街角轉彎半徑，迫使車輛減速轉彎',
      '以鋪面材質與標線界定 30 km/h 生活街區',
    ],
    brief:
      'Apply traffic calming design standards (NACTO / Global Street Design Guide): narrow vehicle travel lanes to about 3.0 meters; add raised speed tables and raised pedestrian crossings; tighten corner curb radii so vehicles must turn slowly; use contrasting paving materials and markings to signal a 30 km/h neighborhood zone; reclaim excess asphalt as sidewalk or greenery.',
  },
  {
    id: 'cycling',
    label: '自行車友善',
    summary: '建置受實體保護的自行車道網絡，與行人、汽車分流。',
    principles: [
      '單向自行車道寬 1.5〜2 公尺，實體分隔',
      '以緣石、花台或停車帶作為保護緩衝',
      '衝突點鋪設綠色鋪面警示',
      '路口設置自行車停等區與專用號誌',
    ],
    brief:
      'Follow protected bikeway design standards (NACTO Urban Bikeway Design Guide): add a physically protected cycle track 1.5 to 2 meters wide for one-way travel, separated from motor traffic by curbs, planters or a parking lane buffer, not just paint; apply green surfacing at conflict zones and intersections; keep the cycle track level, continuous and clear of parked vehicles; add bicycle parking racks where space allows.',
  },
  {
    id: 'transit',
    label: '大眾運輸優先',
    summary: '提升公車與大眾運輸的速度、可靠度與候車品質。',
    principles: [
      '設置公車專用道並以鋪面顏色識別',
      '公車站外推月台，含候車亭與座椅',
      '月台與車門齊平，無障礙上下車',
      '站點整合照明、站牌資訊與遮蔭',
    ],
    brief:
      'Follow transit-priority street design standards (NACTO Transit Street Design Guide): add a dedicated bus lane marked with colored surfacing; build bus bulbs or boarding islands with shelters, seating and lighting so buses stop in-lane; design level boarding platforms flush with bus doors for accessibility; keep transit stops shaded, well-lit and integrated with safe pedestrian crossings.',
  },
  {
    id: 'green',
    label: '綠色街道・氣候韌性',
    summary: '以連續綠帶、雨水花園與透水鋪面提升環境品質與韌性。',
    principles: [
      '行道樹連續樹冠，間距約 6〜10 公尺',
      '緣石外推處設置雨水花園與生態草溝',
      '停車帶與人行道採透水鋪面',
      '增加遮蔭、降低熱島效應',
    ],
    brief:
      'Follow green street and climate resilience design standards (Global Street Design Guide): plant street trees with continuous canopy at roughly 6 to 10 meter spacing in planted furniture zones; convert curb extensions into rain gardens and bioswales that capture stormwater; use permeable paving for parking lanes and sidewalks; maximize shade and greenery to reduce urban heat island effect while keeping walking and cycling paths clear.',
  },
];

export const getGuidelineById = (id: string | null | undefined): DesignGuideline | null =>
  DESIGN_GUIDELINES.find((g) => g.id === id) ?? null;
