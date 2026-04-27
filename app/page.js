'use client'

import { useState } from "react";

export default function Home() {
  const [mw, setMw] = useState(5);
  const [mwh, setMwh] = useState(10);
  const [spread, setSpread] = useState(45);
  const [cycles, setCycles] = useState(1);
  const [fcr, setFcr] = useState(12);
  const [capexPerMWh, setCapexPerMWh] = useState(400000);
  const [opexPercent, setOpexPercent] = useState(2.5);
  const [lifetime, setLifetime] = useState(15);
  const [discountRate, setDiscountRate] = useState(8);
  const [showSummary, setShowSummary] = useState(false);

  const efficiency = 0.88;
  const reserveShare = 0.7;
  const arbitrageShare = 0.3;
  const availability = 0.9;

  const capex = mwh * capexPerMWh;
  const opex = capex * (opexPercent / 100);
  const fcrRevenue = mw * reserveShare * fcr * 8760 * availability;
  const arbitrageRevenue = mwh * arbitrageShare * cycles * 365 * spread * efficiency;
  const revenue = fcrRevenue + arbitrageRevenue;
  const ebitda = revenue - opex;
  const payback = ebitda > 0 ? capex / ebitda : 0;

  function calculateNPV(initialInvestment, annualCashflow, years, ratePercent) {
    const rate = ratePercent / 100;
    let npv = -initialInvestment;
    for (let y = 1; y <= years; y++) {
      npv += annualCashflow / Math.pow(1 + rate, y);
    }
    return npv;
  }

  function calculateIRR(initialInvestment, annualCashflow, years) {
    let low = -0.99;
    let high = 1.5;
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      let npv = -initialInvestment;
      for (let y = 1; y <= years; y++) {
        npv += annualCashflow / Math.pow(1 + mid, y);
      }
      if (npv > 0) low = mid;
      else high = mid;
    }
    return ((low + high) / 2) * 100;
  }

  const npv = ebitda > 0 ? calculateNPV(capex, ebitda, lifetime, discountRate) : -capex;
  const irr = ebitda > 0 ? calculateIRR(capex, ebitda, lifetime) : 0;

  const fcrShare = revenue > 0 ? fcrRevenue / revenue : 0;
  const arbitrageShareResult = revenue > 0 ? arbitrageRevenue / revenue : 0;

  function calculateScore() {
    let score = 0;
    if (irr >= 18) score += 35;
    else if (irr >= 14) score += 28;
    else if (irr >= 10) score += 20;
    else if (irr >= 6) score += 10;
    else score += 3;

    if (payback > 0 && payback <= 5) score += 25;
    else if (payback <= 7) score += 18;
    else if (payback <= 10) score += 10;
    else score += 3;

    if (npv > 0) score += 20;
    else score += 3;

    if (fcrShare >= 0.5) score += 15;
    else if (fcrShare >= 0.3) score += 10;
    else score += 5;

    if (arbitrageShareResult <= 0.4) score += 5;
    else score += 2;

    return Math.min(100, Math.round(score));
  }

  const score = calculateScore();

  const formatEUR = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const summaryText =
`Nordic BESS Pro – Investor Summary

Project size:
- Power: ${mw} MW
- Capacity: ${mwh} MWh

Investment assumptions:
- CAPEX: ${formatEUR(capex)} (${formatEUR(capexPerMWh)} per MWh)
- Annual OPEX: ${formatEUR(opex)}
- Lifetime: ${lifetime} years
- Discount rate: ${discountRate}%

Revenue assumptions:
- FCR price: €${fcr}/MW/h
- Arbitrage spread: €${spread}/MWh
- Cycles per day: ${cycles}
- FCR revenue: ${formatEUR(fcrRevenue)}
- Arbitrage revenue: ${formatEUR(arbitrageRevenue)}
- Total annual revenue: ${formatEUR(revenue)}

Financial output:
- EBITDA: ${formatEUR(ebitda)}
- Payback: ${payback.toFixed(1)} years
- IRR: ${irr.toFixed(1)}%
- NPV: ${formatEUR(npv)}
- Nordic Bankability Score: ${score}/100

Interpretation:
${score >= 75
  ? "The project shows a strong early-stage investment profile with positive NPV, attractive IRR and reasonable payback. The case appears promising under current assumptions, subject to validation of grid connection, market access and supplier pricing."
  : score >= 55
  ? "The project may be interesting, but profitability is sensitive to FCR price, arbitrage spread, CAPEX and availability. Further due diligence is recommended before investment decision."
  : "Under current assumptions, the project does not appear bankable. CAPEX, revenue assumptions or market access would need to improve materially."}
`;

  function applyScenario(type) {
    if (type === "conservative") {
      setSpread(30); setFcr(8); setCycles(0.7); setCapexPerMWh(450000); setOpexPercent(3); setDiscountRate(10);
    }
    if (type === "base") {
      setSpread(45); setFcr(12); setCycles(1); setCapexPerMWh(400000); setOpexPercent(2.5); setDiscountRate(8);
    }
    if (type === "upside") {
      setSpread(65); setFcr(18); setCycles(1.2); setCapexPerMWh(350000); setOpexPercent(2); setDiscountRate(7);
    }
  }

  const inputStyle = { width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #d1d5db", marginTop: "4px", marginBottom: "12px", fontSize: "16px" };
  const cardStyle = { background: "white", padding: "18px", borderRadius: "18px", boxShadow: "0 8px 25px rgba(0,0,0,0.08)", marginBottom: "16px" };
  const metricStyle = { background: "#f8fafc", padding: "14px", borderRadius: "14px", border: "1px solid #e5e7eb" };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "24px", fontFamily: "Arial" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ color: "white", marginBottom: "24px" }}>
          <p style={{ color: "#5eead4", letterSpacing: "2px", fontSize: "12px" }}>NORDIC BESS PRO V1.2</p>
          <h1 style={{ fontSize: "38px", margin: "0 0 8px" }}>⚡ BESS Investment Calculator</h1>
          <p style={{ color: "#cbd5e1", fontSize: "17px" }}>
            Nordic-first screening tool for FCR, arbitrage, CAPEX, OPEX, payback, IRR, NPV and bankability.
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Scenario Presets</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={() => applyScenario("conservative")} style={buttonStyle("#334155")}>Conservative</button>
            <button onClick={() => applyScenario("base")} style={buttonStyle("#059669")}>Base Case</button>
            <button onClick={() => applyScenario("upside")} style={buttonStyle("#0ea5e9")}>Upside</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <div style={cardStyle}>
            <h3>Project Inputs</h3>
            <label>Power, MW</label><input style={inputStyle} value={mw} onChange={(e) => setMw(Number(e.target.value))} />
            <label>Capacity, MWh</label><input style={inputStyle} value={mwh} onChange={(e) => setMwh(Number(e.target.value))} />
            <label>CAPEX €/MWh</label><input style={inputStyle} value={capexPerMWh} onChange={(e) => setCapexPerMWh(Number(e.target.value))} />
            <label>OPEX % of CAPEX / year</label><input style={inputStyle} value={opexPercent} onChange={(e) => setOpexPercent(Number(e.target.value))} />
            <label>Lifetime, years</label><input style={inputStyle} value={lifetime} onChange={(e) => setLifetime(Number(e.target.value))} />
            <label>Discount rate, %</label><input style={inputStyle} value={discountRate} onChange={(e) => setDiscountRate(Number(e.target.value))} />
          </div>

          <div style={cardStyle}>
            <h3>Revenue Inputs</h3>
            <label>Arbitrage spread €/MWh</label><input style={inputStyle} value={spread} onChange={(e) => setSpread(Number(e.target.value))} />
            <label>Cycles/day</label><input style={inputStyle} value={cycles} onChange={(e) => setCycles(Number(e.target.value))} />
            <label>FCR price €/MW/h</label><input style={inputStyle} value={fcr} onChange={(e) => setFcr(Number(e.target.value))} />

            <div style={{ ...metricStyle, marginTop: "16px" }}>
              <strong>Revenue Mix</strong>
              <p>FCR share: {(fcrShare * 100).toFixed(1)}%</p>
              <p>Arbitrage share: {(arbitrageShareResult * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Investment Dashboard</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <div style={metricStyle}><small>Total CAPEX</small><h2>{formatEUR(capex)}</h2></div>
            <div style={metricStyle}><small>Annual Revenue</small><h2>{formatEUR(revenue)}</h2></div>
            <div style={metricStyle}><small>EBITDA</small><h2>{formatEUR(ebitda)}</h2></div>
            <div style={metricStyle}><small>Payback</small><h2>{payback.toFixed(1)} y</h2></div>
            <div style={metricStyle}><small>IRR</small><h2>{irr.toFixed(1)}%</h2></div>
            <div style={metricStyle}><small>NPV</small><h2>{formatEUR(npv)}</h2></div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Nordic Bankability Score</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
            <div style={{
              width: "120px", height: "120px", borderRadius: "50%",
              background: score >= 75 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "30px", fontWeight: "bold"
            }}>{score}</div>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <h2>{score >= 75 ? "Strong early-stage case" : score >= 55 ? "Promising but needs validation" : "Weak or high-risk case"}</h2>
              <p>
                {score >= 75
                  ? "The case shows strong profitability indicators with a positive NPV, attractive IRR and reasonable payback."
                  : score >= 55
                  ? "The case may be interesting, but the outcome is sensitive to FCR price, arbitrage spread, CAPEX and availability."
                  : "Under current assumptions, the project does not appear bankable."}
              </p>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>Investor Summary</h3>
          <button onClick={() => setShowSummary(!showSummary)} style={buttonStyle("#111827")}>
            {showSummary ? "Hide Investor Summary" : "Generate Investor Summary"}
          </button>

          {showSummary && (
            <div style={{ marginTop: "16px" }}>
              <textarea
                value={summaryText}
                readOnly
                style={{
                  width: "100%",
                  minHeight: "360px",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}
              />
              <button
                onClick={() => navigator.clipboard.writeText(summaryText)}
                style={{ ...buttonStyle("#059669"), marginTop: "10px" }}
              >
                Copy Summary
              </button>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3>Revenue Breakdown</h3>
          <p>FCR revenue: <strong>{formatEUR(fcrRevenue)}</strong></p>
          <p>Arbitrage revenue: <strong>{formatEUR(arbitrageRevenue)}</strong></p>
          <p>Annual OPEX: <strong>{formatEUR(opex)}</strong></p>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(color) {
  return {
    background: color,
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  };
}
