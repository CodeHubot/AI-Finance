"""
生成专业级 A 股模拟金融数据
数据覆盖：2020-2024 年报、2022-2024 季报、3 年日 K 线
所有财务数据单位：亿元人民币（除特别标注）
数据仅供教学演示，反映真实市场规律但非真实公司数据
"""
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path(__file__).parent
np.random.seed(2024)

# ──────────────────────────────────────────────
# 基础信息
# ──────────────────────────────────────────────
STOCKS = {
    "600519": {
        "name": "贵州茅台", "sector": "白酒", "industry": "食品饮料",
        "shares": 12.56,   # 总股本（亿股）
        "story": "高端白酒龙头，超高壁垒，长期稳健增长，现金奶牛",
    },
    "300750": {
        "name": "宁德时代", "sector": "新能源", "industry": "电气设备",
        "shares": 23.85,
        "story": "全球动力电池龙头，高速增长后面临竞争压力与利润率分化",
    },
    "601318": {
        "name": "中国平安", "sector": "保险", "industry": "非银金融",
        "shares": 182.8,
        "story": "综合金融集团，寿险改革+地产拖累，利润承压触底回升",
    },
    "600036": {
        "name": "招商银行", "sector": "银行", "industry": "银行",
        "shares": 252.2,
        "story": "零售银行标杆，ROE 远超同业，净息差承压但资产质量优秀",
    },
    "601398": {
        "name": "工商银行", "sector": "银行", "industry": "银行",
        "shares": 3564.2,
        "story": "全球最大银行，规模领先，低估值，股息率具吸引力",
    },
    "002594": {
        "name": "比亚迪", "sector": "新能源汽车", "industry": "汽车",
        "shares": 28.94,   # 亿股（实际约 28.94 亿股）
        "story": "新能源汽车龙头，垂直整合优势，销量爆发带动利润快速释放",
    },
    "600030": {
        "name": "中信证券", "sector": "证券", "industry": "非银金融",
        "shares": 148.8,
        "story": "国内最大券商，业务全面，营收随市场周期波动",
    },
    "300059": {
        "name": "东方财富", "sector": "互联网金融", "industry": "非银金融",
        "shares": 148.2,
        "story": "财富管理平台龙头，轻资产高 ROE，受 A 股成交量影响大",
    },
    "603288": {
        "name": "海天味业", "sector": "调味品", "industry": "食品饮料",
        "shares": 42.5,
        "story": "酱油龙头，高毛利稳定，但高估值遇到零添加竞争与消费降级",
    },
    "000002": {
        "name": "万科A", "sector": "房地产", "industry": "房地产",
        "shares": 116.2,
        "story": "曾经的龙头房企，深陷地产寒冬，流动性压力显著，利润大幅下滑",
    },
}

# ──────────────────────────────────────────────
# 年报数据（亿元）2020-2024
# 字段：revenue, gross_profit, op_profit, net_profit,
#        total_assets, net_assets, op_cashflow,
#        shares_outstanding（亿股）, dps（每股分红元）
# 特殊字段（银行）：nim_pct（净息差%）, npl_ratio（不良率%）
# ──────────────────────────────────────────────
ANNUAL = {
    "600519": [
        {"year": 2020, "revenue": 979, "gross_profit": 893, "op_profit": 610, "net_profit": 467,
         "total_assets": 2145, "net_assets": 1577, "op_cashflow": 540, "dps": 33.69},
        {"year": 2021, "revenue": 1095, "gross_profit": 1005, "op_profit": 685, "net_profit": 524,
         "total_assets": 2528, "net_assets": 1810, "op_cashflow": 625, "dps": 38.00},
        {"year": 2022, "revenue": 1275, "gross_profit": 1175, "op_profit": 803, "net_profit": 627,
         "total_assets": 2990, "net_assets": 2045, "op_cashflow": 740, "dps": 43.97},
        {"year": 2023, "revenue": 1477, "gross_profit": 1367, "op_profit": 940, "net_profit": 747,
         "total_assets": 3652, "net_assets": 2498, "op_cashflow": 870, "dps": 50.40},
        {"year": 2024, "revenue": 1598, "gross_profit": 1483, "op_profit": 1018, "net_profit": 805,
         "total_assets": 4188, "net_assets": 2780, "op_cashflow": 960, "dps": 55.80},
    ],
    "300750": [
        {"year": 2020, "revenue": 503, "gross_profit": 140, "op_profit": 66, "net_profit": 56,
         "total_assets": 1782, "net_assets": 380, "op_cashflow": 38, "dps": 0.55},
        {"year": 2021, "revenue": 1304, "gross_profit": 343, "op_profit": 188, "net_profit": 159,
         "total_assets": 3450, "net_assets": 720, "op_cashflow": 95, "dps": 1.00},
        {"year": 2022, "revenue": 3286, "gross_profit": 667, "op_profit": 382, "net_profit": 307,
         "total_assets": 6060, "net_assets": 1430, "op_cashflow": 510, "dps": 1.50},
        {"year": 2023, "revenue": 4009, "gross_profit": 918, "op_profit": 538, "net_profit": 442,
         "total_assets": 6840, "net_assets": 1895, "op_cashflow": 780, "dps": 2.00},
        {"year": 2024, "revenue": 3585, "gross_profit": 796, "op_profit": 452, "net_profit": 380,
         "total_assets": 7020, "net_assets": 2200, "op_cashflow": 620, "dps": 1.80},
    ],
    # 中国平安：revenue = 保费及保单管理费收入（简化口径，亿元）
    # 归母净利润含投资收益波动（2021/2022受地产敞口拖累）
    "601318": [
        {"year": 2020, "revenue": 8820, "gross_profit": None, "op_profit": 2050, "net_profit": 1430,
         "total_assets": 92972, "net_assets": 6775, "op_cashflow": 2200, "dps": 2.20, "nim_pct": None, "npl_ratio": None},
        {"year": 2021, "revenue": 8980, "gross_profit": None, "op_profit": 1480, "net_profit": 1016,
         "total_assets": 102831, "net_assets": 7100, "op_cashflow": 2350, "dps": 1.50, "nim_pct": None, "npl_ratio": None},
        {"year": 2022, "revenue": 8350, "gross_profit": None, "op_profit": 1120, "net_profit": 838,
         "total_assets": 111063, "net_assets": 7350, "op_cashflow": 2500, "dps": 1.50, "nim_pct": None, "npl_ratio": None},
        {"year": 2023, "revenue": 8560, "gross_profit": None, "op_profit": 1250, "net_profit": 856,
         "total_assets": 117168, "net_assets": 7830, "op_cashflow": 2700, "dps": 1.50, "nim_pct": None, "npl_ratio": None},
        {"year": 2024, "revenue": 8820, "gross_profit": None, "op_profit": 1380, "net_profit": 930,
         "total_assets": 123500, "net_assets": 8200, "op_cashflow": 2900, "dps": 1.50, "nim_pct": None, "npl_ratio": None},
    ],
    # 招商银行：revenue = 营业收入（利息净收入+手续费+其他，亿元）
    "600036": [
        {"year": 2020, "revenue": 2905, "gross_profit": None, "op_profit": 1530, "net_profit": 1190,
         "total_assets": 78924, "net_assets": 4919, "op_cashflow": 1850, "dps": 1.522, "nim_pct": 2.49, "npl_ratio": 0.95},
        {"year": 2021, "revenue": 3312, "gross_profit": None, "op_profit": 1752, "net_profit": 1330,
         "total_assets": 92913, "net_assets": 5750, "op_cashflow": 2100, "dps": 1.522, "nim_pct": 2.48, "npl_ratio": 0.91},
        {"year": 2022, "revenue": 3448, "gross_profit": None, "op_profit": 1831, "net_profit": 1380,
         "total_assets": 102259, "net_assets": 6413, "op_cashflow": 2350, "dps": 1.522, "nim_pct": 2.40, "npl_ratio": 0.96},
        {"year": 2023, "revenue": 3391, "gross_profit": None, "op_profit": 1776, "net_profit": 1466,
         "total_assets": 112055, "net_assets": 7270, "op_cashflow": 2520, "dps": 1.972, "nim_pct": 2.15, "npl_ratio": 0.95},
        {"year": 2024, "revenue": 3310, "gross_profit": None, "op_profit": 1720, "net_profit": 1490,
         "total_assets": 119000, "net_assets": 7950, "op_cashflow": 2600, "dps": 2.000, "nim_pct": 1.99, "npl_ratio": 0.95},
    ],
    # 工商银行：revenue = 营业收入（亿元），全球资产规模最大银行
    "601398": [
        {"year": 2020, "revenue": 8226, "gross_profit": None, "op_profit": 3740, "net_profit": 3170,
         "total_assets": 333424, "net_assets": 26498, "op_cashflow": 8500, "dps": 0.2627, "nim_pct": 2.15, "npl_ratio": 1.58},
        {"year": 2021, "revenue": 8672, "gross_profit": None, "op_profit": 3870, "net_profit": 3480,
         "total_assets": 358134, "net_assets": 28550, "op_cashflow": 9200, "dps": 0.2934, "nim_pct": 2.11, "npl_ratio": 1.42},
        {"year": 2022, "revenue": 8958, "gross_profit": None, "op_profit": 4000, "net_profit": 3604,
         "total_assets": 385601, "net_assets": 30800, "op_cashflow": 9800, "dps": 0.3053, "nim_pct": 1.92, "npl_ratio": 1.38},
        {"year": 2023, "revenue": 8583, "gross_profit": None, "op_profit": 4020, "net_profit": 3641,
         "total_assets": 420437, "net_assets": 32870, "op_cashflow": 10200, "dps": 0.3064, "nim_pct": 1.61, "npl_ratio": 1.36},
        {"year": 2024, "revenue": 8220, "gross_profit": None, "op_profit": 3960, "net_profit": 3680,
         "total_assets": 448000, "net_assets": 34800, "op_cashflow": 10800, "dps": 0.3100, "nim_pct": 1.47, "npl_ratio": 1.35},
    ],
    "002594": [
        {"year": 2020, "revenue": 1566, "gross_profit": 225, "op_profit": 42, "net_profit": 42,
         "total_assets": 2578, "net_assets": 1011, "op_cashflow": 180, "dps": 0},
        {"year": 2021, "revenue": 2161, "gross_profit": 295, "op_profit": 36, "net_profit": 30,
         "total_assets": 3652, "net_assets": 1234, "op_cashflow": 230, "dps": 0},
        {"year": 2022, "revenue": 4241, "gross_profit": 625, "op_profit": 200, "net_profit": 166,
         "total_assets": 5895, "net_assets": 2166, "op_cashflow": 450, "dps": 0.40},
        {"year": 2023, "revenue": 6023, "gross_profit": 1112, "op_profit": 380, "net_profit": 300,
         "total_assets": 7891, "net_assets": 2841, "op_cashflow": 680, "dps": 0.62},
        {"year": 2024, "revenue": 7775, "gross_profit": 1440, "op_profit": 540, "net_profit": 402,
         "total_assets": 9800, "net_assets": 3600, "op_cashflow": 820, "dps": 0.80},
    ],
    "600030": [
        {"year": 2020, "revenue": 543, "gross_profit": None, "op_profit": 188, "net_profit": 149,
         "total_assets": 10870, "net_assets": 1418, "op_cashflow": 620, "dps": 0.35},
        {"year": 2021, "revenue": 765, "gross_profit": None, "op_profit": 274, "net_profit": 233,
         "total_assets": 13588, "net_assets": 1760, "op_cashflow": 980, "dps": 0.60},
        {"year": 2022, "revenue": 651, "gross_profit": None, "op_profit": 214, "net_profit": 175,
         "total_assets": 13940, "net_assets": 1908, "op_cashflow": 820, "dps": 0.40},
        {"year": 2023, "revenue": 600, "gross_profit": None, "op_profit": 195, "net_profit": 197,
         "total_assets": 14000, "net_assets": 2070, "op_cashflow": 770, "dps": 0.44},
        {"year": 2024, "revenue": 645, "gross_profit": None, "op_profit": 218, "net_profit": 210,
         "total_assets": 14600, "net_assets": 2220, "op_cashflow": 820, "dps": 0.48},
    ],
    "300059": [
        {"year": 2020, "revenue": 78, "gross_profit": None, "op_profit": 50, "net_profit": 50,
         "total_assets": 2256, "net_assets": 373, "op_cashflow": 68, "dps": 0.33},
        {"year": 2021, "revenue": 165, "gross_profit": None, "op_profit": 110, "net_profit": 110,
         "total_assets": 4230, "net_assets": 620, "op_cashflow": 112, "dps": 0.62},
        {"year": 2022, "revenue": 105, "gross_profit": None, "op_profit": 68, "net_profit": 68,
         "total_assets": 4652, "net_assets": 688, "op_cashflow": 85, "dps": 0.37},
        {"year": 2023, "revenue": 88, "gross_profit": None, "op_profit": 56, "net_profit": 56,
         "total_assets": 4450, "net_assets": 730, "op_cashflow": 72, "dps": 0.30},
        {"year": 2024, "revenue": 96, "gross_profit": None, "op_profit": 62, "net_profit": 62,
         "total_assets": 4800, "net_assets": 780, "op_cashflow": 79, "dps": 0.33},
    ],
    "603288": [
        {"year": 2020, "revenue": 228, "gross_profit": 103, "op_profit": 73, "net_profit": 64,
         "total_assets": 320, "net_assets": 198, "op_cashflow": 78, "dps": 1.19},
        {"year": 2021, "revenue": 250, "gross_profit": 112, "op_profit": 80, "net_profit": 66,
         "total_assets": 354, "net_assets": 233, "op_cashflow": 85, "dps": 1.21},
        {"year": 2022, "revenue": 256, "gross_profit": 113, "op_profit": 80, "net_profit": 66,
         "total_assets": 380, "net_assets": 262, "op_cashflow": 87, "dps": 1.21},
        {"year": 2023, "revenue": 246, "gross_profit": 107, "op_profit": 74, "net_profit": 61,
         "total_assets": 400, "net_assets": 286, "op_cashflow": 80, "dps": 1.12},
        {"year": 2024, "revenue": 258, "gross_profit": 115, "op_profit": 80, "net_profit": 66,
         "total_assets": 422, "net_assets": 315, "op_cashflow": 88, "dps": 1.20},
    ],
    "000002": [
        {"year": 2020, "revenue": 4195, "gross_profit": 819, "op_profit": 507, "net_profit": 415,
         "total_assets": 17113, "net_assets": 2098, "op_cashflow": -318, "dps": 1.00},
        {"year": 2021, "revenue": 4528, "gross_profit": 756, "op_profit": 418, "net_profit": 226,
         "total_assets": 18226, "net_assets": 2239, "op_cashflow": -695, "dps": 0.82},
        {"year": 2022, "revenue": 4170, "gross_profit": 579, "op_profit": 219, "net_profit": 226,
         "total_assets": 17579, "net_assets": 2302, "op_cashflow": -521, "dps": 0.38},
        {"year": 2023, "revenue": 3761, "gross_profit": 376, "op_profit": 35, "net_profit": -36,
         "total_assets": 16118, "net_assets": 1957, "op_cashflow": 128, "dps": 0},
        {"year": 2024, "revenue": 2458, "gross_profit": 148, "op_profit": -98, "net_profit": -45,
         "total_assets": 13800, "net_assets": 1680, "op_cashflow": 380, "dps": 0},
    ],
}

# ──────────────────────────────────────────────
# 季度收入分配比例 [Q1, Q2, Q3, Q4]
# ──────────────────────────────────────────────
SEASONAL_REVENUE = {
    "600519": [0.22, 0.24, 0.28, 0.26],  # 茅台：相对均衡，Q3/Q4旺季
    "300750": [0.18, 0.24, 0.28, 0.30],  # 宁德：下半年EV交付旺季
    "601318": [0.25, 0.25, 0.25, 0.25],  # 平安：保费较均衡
    "600036": [0.23, 0.25, 0.26, 0.26],  # 招行：均衡
    "601398": [0.23, 0.25, 0.26, 0.26],  # 工行：均衡
    "002594": [0.17, 0.22, 0.28, 0.33],  # 比亚迪：Q4交付旺季
    "600030": [0.22, 0.26, 0.26, 0.26],  # 中信：市场相关
    "300059": [0.20, 0.26, 0.28, 0.26],  # 东财：交易活跃度
    "603288": [0.33, 0.22, 0.22, 0.23],  # 海天：Q1备货最强
    "000002": [0.08, 0.12, 0.22, 0.58],  # 万科：Q4交付最多
}

# 净利润季度分配（与营收有差异）
SEASONAL_PROFIT = {
    "600519": [0.22, 0.25, 0.27, 0.26],
    "300750": [0.17, 0.23, 0.28, 0.32],
    "601318": [0.26, 0.26, 0.24, 0.24],
    "600036": [0.23, 0.26, 0.26, 0.25],
    "601398": [0.23, 0.26, 0.26, 0.25],
    "002594": [0.15, 0.20, 0.28, 0.37],
    "600030": [0.22, 0.27, 0.27, 0.24],
    "300059": [0.20, 0.27, 0.28, 0.25],
    "603288": [0.34, 0.22, 0.21, 0.23],
    "000002": [0.08, 0.12, 0.18, 0.62],
}

# ──────────────────────────────────────────────
# 股价锚点（季度末收盘价，元）
# 反映真实市场规律：2022大跌、2023温和修复、2024分化
# ──────────────────────────────────────────────
PRICE_ANCHORS = {
    "600519": [1818, 1710, 1740, 1603, 1700, 1650, 1780, 1755, 1620, 1498, 1552, 1490],
    "300750": [460,  305,  220,  183,  200,  215,  230,  218,  205,  195,  180,  175],
    "601318": [57.0, 50.2, 45.8, 42.0, 43.5, 42.0, 41.2, 40.1, 38.8, 37.6, 39.2, 38.5],
    "600036": [53.0, 44.8, 40.2, 35.8, 35.2, 34.0, 32.6, 31.5, 30.2, 29.8, 34.5, 33.8],
    "601398": [5.18, 4.75, 4.52, 4.38, 4.50, 4.62, 4.88, 4.72, 5.20, 5.68, 6.05, 6.18],
    "002594": [318,  350,  310,  233,  250,  268,  248,  238,  228,  245,  308,  295],
    "600030": [24.5, 22.3, 19.8, 17.8, 18.5, 18.0, 17.2, 16.8, 18.5, 20.2, 22.8, 23.5],
    "300059": [27.5, 22.8, 19.5, 16.8, 17.5, 16.8, 15.6, 14.9, 14.2, 13.8, 16.5, 17.2],
    "603288": [78.0, 68.5, 58.2, 52.0, 49.5, 43.8, 40.2, 38.5, 36.8, 35.2, 42.5, 41.8],
    "000002": [20.5, 18.2, 14.5, 12.8, 11.5, 10.2,  9.1,  8.3,  7.5,  6.8,  7.2,  6.9],
}

# 日均换手率参考（%）
TURNOVER_BASE = {
    "600519": 0.18, "300750": 0.85, "601318": 0.30, "600036": 0.35,
    "601398": 0.08, "002594": 0.65, "600030": 0.50, "300059": 1.20,
    "603288": 0.25, "000002": 0.55,
}


def _add_noise(val, pct=0.03):
    """添加小幅随机扰动"""
    if val is None:
        return None
    return round(val * (1 + np.random.uniform(-pct, pct)), 4)


def generate_annual_data():
    """生成年报汇总（5年，亿元）"""
    rows = []
    for symbol, info in STOCKS.items():
        for ann in ANNUAL[symbol]:
            rev = ann["revenue"]
            gp = ann.get("gross_profit")
            np_ = ann["net_profit"]
            ta = ann["total_assets"]
            na = ann["net_assets"]
            shares = info["shares"]

            gross_margin = round(gp / rev * 100, 2) if gp and rev else None
            net_margin = round(np_ / rev * 100, 2) if np_ and rev else None
            roe = round(np_ / na * 100, 2) if np_ and na else None
            roa = round(np_ / ta * 100, 2) if np_ and ta else None
            debt_ratio = round((ta - na) / ta * 100, 2) if ta and na else None
            eps = round(np_ / shares, 4) if np_ else None

            row = {
                "symbol": symbol,
                "name": info["name"],
                "sector": info["sector"],
                "year": ann["year"],
                "revenue_100m": rev,
                "gross_profit_100m": gp,
                "gross_margin_pct": gross_margin,
                "op_profit_100m": ann.get("op_profit"),
                "net_profit_100m": np_,
                "net_margin_pct": net_margin,
                "total_assets_100m": ta,
                "net_assets_100m": na,
                "debt_ratio_pct": debt_ratio,
                "roe_pct": roe,
                "roa_pct": roa,
                "op_cashflow_100m": ann.get("op_cashflow"),
                "eps_yuan": eps,
                "dps_yuan": ann.get("dps", 0),
                "nim_pct": ann.get("nim_pct"),
                "npl_ratio_pct": ann.get("npl_ratio"),
            }
            rows.append(row)

    df = pd.DataFrame(rows)
    df.to_csv(DATA_DIR / "annual_all_stocks.csv", index=False, encoding="utf-8-sig")
    print("✓ 年报数据：annual_all_stocks.csv")


def generate_quarterly_data(symbol: str):
    """生成季报数据（2022Q1-2024Q4，12个季度，亿元）"""
    info = STOCKS[symbol]
    ann_data = {a["year"]: a for a in ANNUAL[symbol]}
    rev_ratios = SEASONAL_REVENUE[symbol]
    prof_ratios = SEASONAL_PROFIT[symbol]

    quarters = []
    period_ends = [
        "2022-03-31", "2022-06-30", "2022-09-30", "2022-12-31",
        "2023-03-31", "2023-06-30", "2023-09-30", "2023-12-31",
        "2024-03-31", "2024-06-30", "2024-09-30", "2024-12-31",
    ]
    labels = [
        "2022Q1", "2022Q2", "2022Q3", "2022Q4",
        "2023Q1", "2023Q2", "2023Q3", "2023Q4",
        "2024Q1", "2024Q2", "2024Q3", "2024Q4",
    ]

    price_anchors = PRICE_ANCHORS[symbol]  # 12 个季度末价格
    shares = info["shares"]

    prev_rev = None
    prev_profit = None

    for i, (label, period_end) in enumerate(zip(labels, period_ends)):
        year = int(label[:4])
        q_idx = i % 4
        ann = ann_data.get(year, ann_data[2024])
        prev_ann = ann_data.get(year - 1, ann_data.get(2022))

        # 季度营收
        rev = round(ann["revenue"] * rev_ratios[q_idx] * _add_noise(1, 0.025), 2)
        # 季度净利润
        np_ = round(ann["net_profit"] * prof_ratios[q_idx] * _add_noise(1, 0.03), 2) if ann["net_profit"] else None

        # 毛利润（季度）
        gp_annual = ann.get("gross_profit")
        gp = round(gp_annual * rev_ratios[q_idx] * _add_noise(1, 0.02), 2) if gp_annual else None

        # 同比增速
        if prev_ann and prev_ann["revenue"]:
            prev_q_rev = prev_ann["revenue"] * rev_ratios[q_idx]
            rev_yoy = round((rev - prev_q_rev) / prev_q_rev * 100, 2)
        else:
            rev_yoy = None

        if prev_ann and prev_ann["net_profit"] and np_:
            prev_q_profit = prev_ann["net_profit"] * prof_ratios[q_idx]
            profit_yoy = round((np_ - prev_q_profit) / abs(prev_q_profit) * 100, 2) if prev_q_profit != 0 else None
        else:
            profit_yoy = None

        # 毛利率
        gross_margin = round(gp / rev * 100, 2) if gp and rev else None
        # 净利率
        net_margin = round(np_ / rev * 100, 2) if np_ and rev else None

        # 余额科目用线性插值（期末）
        ta_start = ann_data.get(year - 1, ann)["total_assets"]
        ta_end = ann["total_assets"]
        progress = (q_idx + 1) / 4
        total_assets = round(ta_start + (ta_end - ta_start) * progress * _add_noise(1, 0.01), 2)

        na_start = ann_data.get(year - 1, ann)["net_assets"]
        na_end = ann["net_assets"]
        net_assets = round(na_start + (na_end - na_start) * progress * _add_noise(1, 0.01), 2)

        debt_ratio = round((total_assets - net_assets) / total_assets * 100, 2)

        # ROE 年化 = 单季净利润 / 净资产 * 4
        roe_annualized = round(np_ / net_assets * 4 * 100, 2) if np_ and net_assets else None

        # EPS
        eps = round(np_ / shares, 4) if np_ else None

        # 经营现金流（季度，粗略）
        ocf_annual = ann.get("op_cashflow", 0) or 0
        op_cashflow = round(ocf_annual * [0.18, 0.24, 0.28, 0.30][q_idx] * _add_noise(1, 0.08), 2)

        # 市场数据
        price = price_anchors[i]
        market_cap = round(price * shares, 2)
        ttm_profit = sum([ann["net_profit"] * prof_ratios[j] for j in range(4)]) if ann["net_profit"] else None
        pe_ttm = round(market_cap / ttm_profit, 2) if ttm_profit and ttm_profit > 0 else None
        pb = round(market_cap / net_assets, 2) if net_assets and net_assets > 0 else None

        # 流动比率（粗略）
        if symbol in ("600036", "601398"):  # 银行无传统流动比率
            current_ratio = None
        else:
            current_ratio = round(_add_noise(1.5 if symbol != "000002" else 0.9, 0.08), 2)

        row = {
            "quarter": label,
            "period_end": period_end,
            "symbol": symbol,
            "name": info["name"],
            "sector": info["sector"],
            "revenue_100m": rev,
            "revenue_yoy_pct": rev_yoy,
            "gross_profit_100m": gp,
            "gross_margin_pct": gross_margin,
            "net_profit_100m": np_,
            "net_profit_yoy_pct": profit_yoy,
            "net_margin_pct": net_margin,
            "eps_yuan": eps,
            "total_assets_100m": total_assets,
            "net_assets_100m": net_assets,
            "debt_ratio_pct": debt_ratio,
            "current_ratio": current_ratio,
            "roe_annualized_pct": roe_annualized,
            "op_cashflow_100m": op_cashflow,
            "close_price_yuan": price,
            "market_cap_100m": market_cap,
            "pe_ttm": pe_ttm,
            "pb_ratio": pb,
            "nim_pct": ann.get("nim_pct"),
            "npl_ratio_pct": ann.get("npl_ratio"),
        }
        quarters.append(row)

    df = pd.DataFrame(quarters)
    df.to_csv(DATA_DIR / f"stock_{symbol}_financial.csv", index=False, encoding="utf-8-sig")


def generate_price_data(symbol: str):
    """生成日 K 线数据（2022-01-04 至 2024-12-31）"""
    info = STOCKS[symbol]
    anchors = PRICE_ANCHORS[symbol]  # 12个季度末价格

    # 季度末日期
    anchor_dates = pd.to_datetime([
        "2022-03-31", "2022-06-30", "2022-09-30", "2022-12-31",
        "2023-03-31", "2023-06-30", "2023-09-30", "2023-12-31",
        "2024-03-31", "2024-06-30", "2024-09-30", "2024-12-31",
    ])

    all_dates = pd.bdate_range("2022-01-04", "2024-12-31")
    n = len(all_dates)

    # 用 GBM + 均值回归（向锚点漂移）生成每日收盘价
    prices = np.zeros(n)
    prices[0] = anchors[0] * np.random.uniform(0.97, 1.03)

    # 确定每个交易日所属季度及目标价
    quarter_ends = [(pd.to_datetime(f"{2022 + i//4}-{[3,6,9,12][i%4]:02d}-{[31,30,30,31][i%4]}"),
                     anchors[i]) for i in range(12)]

    def get_target(date):
        for qe, p in quarter_ends:
            if date <= qe:
                return p
        return anchors[-1]

    vol = {
        "600519": 0.010, "300750": 0.022, "601318": 0.014,
        "600036": 0.013, "601398": 0.010, "002594": 0.022,
        "600030": 0.018, "300059": 0.025, "603288": 0.014, "000002": 0.018,
    }[symbol]

    for i in range(1, n):
        target = get_target(all_dates[i])
        mean_rev_strength = 0.008  # 均值回归强度
        drift = mean_rev_strength * (np.log(target) - np.log(prices[i-1]))
        shock = np.random.normal(0, vol)
        prices[i] = prices[i-1] * np.exp(drift + shock)
        # A 股涨跌停限制（±10%）
        prices[i] = np.clip(prices[i], prices[i-1] * 0.90, prices[i-1] * 1.10)
        prices[i] = max(prices[i], 0.01)

    # 生成 OHLC
    opens, highs, lows, closes, volumes, turnovers = [], [], [], [], [], []
    turnover_base = TURNOVER_BASE[symbol]
    shares_float = info["shares"] * 0.65  # 假设 65% 流通股

    for i, price in enumerate(prices):
        # 开盘价相对收盘价有小幅偏差
        open_p = price * np.random.uniform(0.993, 1.007)
        close_p = price
        spread = abs(close_p - open_p)
        high_p = max(open_p, close_p) + np.random.uniform(0.001, 0.008) * price + spread * 0.3
        low_p = min(open_p, close_p) - np.random.uniform(0.001, 0.008) * price - spread * 0.3
        high_p = min(high_p, price * 1.099)
        low_p = max(low_p, price * 0.901)

        # 换手率：与价格波动正相关
        daily_change = abs(close_p - prices[i-1]) / prices[i-1] if i > 0 else 0
        turnover = turnover_base * (1 + daily_change * 15) * np.random.uniform(0.6, 1.5)
        turnover = round(min(turnover, 8.0), 4)
        vol_shares = int(shares_float * 1e8 * turnover / 100)

        opens.append(round(open_p, 2))
        highs.append(round(high_p, 2))
        lows.append(round(low_p, 2))
        closes.append(round(close_p, 2))
        volumes.append(vol_shares)
        turnovers.append(turnover)

    closes_arr = np.array(closes)
    prev_closes = np.concatenate([[closes_arr[0]], closes_arr[:-1]])
    change_pct = np.round((closes_arr - prev_closes) / prev_closes * 100, 2)
    amplitude_pct = np.round((np.array(highs) - np.array(lows)) / prev_closes * 100, 2)
    market_cap = np.round(closes_arr * info["shares"], 2)

    df = pd.DataFrame({
        "date": [d.strftime("%Y-%m-%d") for d in all_dates],
        "open": opens,
        "high": highs,
        "low": lows,
        "close": closes,
        "volume": volumes,
        "turnover_rate_pct": turnovers,
        "change_pct": change_pct,
        "amplitude_pct": amplitude_pct,
        "market_cap_100m": market_cap,
        "symbol": symbol,
        "name": info["name"],
    })
    df.to_csv(DATA_DIR / f"stock_{symbol}_price.csv", index=False, encoding="utf-8-sig")


def generate_sector_comparison():
    """生成行业对比表（最新时点数据，用于横向对比）"""
    rows = []
    for symbol, info in STOCKS.items():
        ann = ANNUAL[symbol][-1]   # 2024 年数据
        q_data = [a for a in ANNUAL[symbol]]
        latest_price = PRICE_ANCHORS[symbol][-1]
        shares = info["shares"]
        market_cap = round(latest_price * shares, 2)

        rev = ann["revenue"]
        np_ = ann["net_profit"]
        gp = ann.get("gross_profit")
        ta = ann["total_assets"]
        na = ann["net_assets"]

        prev_rev = ANNUAL[symbol][-2]["revenue"]
        prev_np = ANNUAL[symbol][-2]["net_profit"]

        rows.append({
            "symbol": symbol,
            "name": info["name"],
            "sector": info["sector"],
            "industry": info["industry"],
            "story": info["story"],
            "latest_price_yuan": latest_price,
            "market_cap_100m": market_cap,
            "revenue_100m": rev,
            "net_profit_100m": np_,
            "gross_margin_pct": round(gp / rev * 100, 2) if gp and rev else None,
            "net_margin_pct": round(np_ / rev * 100, 2) if np_ and rev else None,
            "roe_pct": round(np_ / na * 100, 2) if np_ and na else None,
            "roa_pct": round(np_ / ta * 100, 2) if np_ and ta else None,
            "debt_ratio_pct": round((ta - na) / ta * 100, 2) if ta and na else None,
            "revenue_growth_yoy_pct": round((rev - prev_rev) / prev_rev * 100, 2) if prev_rev else None,
            "profit_growth_yoy_pct": round((np_ - prev_np) / abs(prev_np) * 100, 2) if prev_np and prev_np != 0 else None,
            "pe_ttm": round(market_cap / np_, 2) if np_ and np_ > 0 else None,
            "pb_ratio": round(market_cap / na, 2) if na and na > 0 else None,
            "eps_yuan": round(np_ / info["shares"], 4) if np_ else None,
            "dps_yuan": ann.get("dps", 0),
            "dividend_yield_pct": round(ann.get("dps", 0) / latest_price * 100, 2) if ann.get("dps") else 0,
            "nim_pct": ann.get("nim_pct"),
            "npl_ratio_pct": ann.get("npl_ratio"),
            "total_assets_100m": ta,
            "shares_100m": info["shares"],
        })

    df = pd.DataFrame(rows)
    df.to_csv(DATA_DIR / "sector_comparison.csv", index=False, encoding="utf-8-sig")
    print("✓ 行业对比：sector_comparison.csv")


def generate_data_readme():
    """生成数据字典说明文件"""
    content = """# 模拟金融数据字典

## 数据范围
- 时间：2020-2024（年报）、2022Q1-2024Q4（季报）、2022-01-04 至 2024-12-31（日 K）
- 标的：10 支 A 股代表性标的（白酒/新能源/保险/银行/汽车/证券/互联网金融/调味品/房地产）
- 单位：财务数据均为 **亿元人民币**（除特别标注）

## 文件清单

| 文件名 | 说明 |
|--------|------|
| annual_all_stocks.csv | 所有标的年报数据（2020-2024） |
| sector_comparison.csv | 行业横向对比（最新数据） |
| stock_{symbol}_price.csv | 日 K 线数据 |
| stock_{symbol}_financial.csv | 季报财务数据 |

## 字段说明

### 财务字段
| 字段 | 含义 | 单位 |
|------|------|------|
| revenue_100m | 营业收入 | 亿元 |
| gross_profit_100m | 毛利润 | 亿元 |
| gross_margin_pct | 毛利率 | % |
| net_profit_100m | 归母净利润 | 亿元 |
| net_margin_pct | 净利率（归母） | % |
| total_assets_100m | 总资产 | 亿元 |
| net_assets_100m | 归母净资产 | 亿元 |
| debt_ratio_pct | 资产负债率 | % |
| roe_pct / roe_annualized_pct | 净资产收益率（年化） | % |
| roa_pct | 总资产收益率 | % |
| op_cashflow_100m | 经营活动现金流净额 | 亿元 |
| eps_yuan | 每股收益 | 元/股 |
| dps_yuan | 每股股利 | 元/股 |
| nim_pct | 净息差（仅银行） | % |
| npl_ratio_pct | 不良贷款率（仅银行） | % |

### 市场字段
| 字段 | 含义 | 单位 |
|------|------|------|
| close_price_yuan | 收盘价 | 元 |
| market_cap_100m | 总市值 | 亿元 |
| pe_ttm | 市盈率（TTM） | 倍 |
| pb_ratio | 市净率 | 倍 |
| turnover_rate_pct | 换手率 | % |
| change_pct | 涨跌幅 | % |
| amplitude_pct | 振幅 | % |

## 标的简介

| 代码 | 名称 | 行业 | 投资逻辑 |
|------|------|------|---------|
| 600519 | 贵州茅台 | 白酒 | 高端消费品垄断，超高壁垒，净利率~50% |
| 300750 | 宁德时代 | 新能源 | 全球动力电池龙头，高增后竞争压力加剧 |
| 601318 | 中国平安 | 保险 | 综合金融，寿险改革阵痛，估值历史低位 |
| 600036 | 招商银行 | 银行 | 零售银行标杆，ROE 行业领先 |
| 601398 | 工商银行 | 银行 | 全球最大银行，低估值高股息 |
| 002594 | 比亚迪 | 汽车 | 新能源汽车+电池垂直整合，销量持续爆发 |
| 600030 | 中信证券 | 证券 | 龙头券商，业务全面，周期性强 |
| 300059 | 东方财富 | 互联网金融 | 财富管理平台，轻资产高 ROE |
| 603288 | 海天味业 | 调味品 | 酱油龙头，高壁垒，但面临估值压缩 |
| 000002 | 万科A | 房地产 | 行业寒冬典型，利润大幅下滑，流动性承压 |

## 免责声明
本数据为教学演示用模拟数据，基于真实市场规律设计但并非真实公司数据，
不代表任何投资建议。
"""
    (DATA_DIR / "DATA_README.md").write_text(content, encoding="utf-8")
    print("✓ 数据字典：DATA_README.md")


if __name__ == "__main__":
    print("=" * 50)
    print("开始生成专业级 A 股模拟金融数据")
    print("=" * 50)

    generate_annual_data()

    for symbol in STOCKS:
        name = STOCKS[symbol]["name"]
        generate_quarterly_data(symbol)
        print(f"✓ 季报数据：{name}（{symbol}）")
        generate_price_data(symbol)
        print(f"✓ 日K线数据：{name}（{symbol}）")

    generate_sector_comparison()
    generate_data_readme()

    print("=" * 50)
    print("所有数据生成完成！")
    print(f"输出目录：{DATA_DIR}")
    print("=" * 50)
