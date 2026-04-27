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
  
function findBreakEvenCapexPerMWh() {
  let low = 100000;
  let high = 1000000;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;

    const testCapex = mwh * mid;
    const testOpex = testCapex * (opexPercent / 100);
    const testEbitda = revenue - testOpex;

    const testNPV = testEbitda > 0
      ? calculateNPV(testCapex, testEbitda, lifetime, discountRate)
      : -testCapex;

    if (testNPV > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}
  
  const npv = ebitda > 0 ? calculateNPV(capex, ebitda, lifetime, discountRate) : -capex;
  const irr = ebitda > 0 ? calculateIRR(capex, ebitda, lifetime) : 0;
  
  const breakEvenCapexPerMWh = findBreakEvenCapexPerMWh();

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

  function runSensitivity(capexMultiplier) {
  const adjustedCapex = capex * capexMultiplier;
  const adjustedOpex = adjustedCapex * (opexPercent / 100);
  const adjustedEbitda = revenue - adjustedOpex;
  const adjustedPayback = adjustedEbitda > 0 ? adjustedCapex / adjustedEbitda : 0;
  const adjustedNPV = adjustedEbitda > 0
    ? calculateNPV(adjustedCapex, adjustedEbitda, lifetime, discountRate)
    : -adjustedCapex;
  const adjustedIRR = adjustedEbitda > 0
    ? calculateIRR(adjustedCapex, adjustedEbitda, lifetime)
    : 0;

  return {
    capex: adjustedCapex,
    opex: adjustedOpex,
    ebitda: adjustedEbitda,
    payback: adjustedPayback,
    npv: adjustedNPV,
    irr: adjustedIRR
  };
}

const sensitivityCases = [
  { label: "CAPEX -20%", factor: 0.8 },
  { label: "Base Case", factor: 1.0 },
  { label: "CAPEX +20%", factor: 1.2 }
];
  
const irrCurveData = [
  { label: "-30%", factor: 0.7 },
  { label: "-20%", factor: 0.8 },
  { label: "-10%", factor: 0.9 },
  { label: "Base", factor: 1.0 },
  { label: "+10%", factor: 1.1 },
  { label: "+20%", factor: 1.2 },
  { label: "+30%", factor: 1.3 }
].map((item) => {
  const s = runSensitivity(item.factor);
  return {
    ...item,
    irr: s.irr,
    npv: s.npv,
    capex: s.capex
  };
});

const maxIrr = Math.max(...irrCurveData.map((item) => Math.max(item.irr, 0)), 1);
  
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

  function exportPDF() {
  const content = `
NORDIC BESS PRO – INVESTMENT REPORT

Project:
Power: ${mw} MW
Capacity: ${mwh} MWh

CAPEX:
${formatEUR(capex)} (${formatEUR(capexPerMWh)} / MWh)

OPEX:
${formatEUR(opex)} per year

Revenue:
FCR: ${formatEUR(fcrRevenue)}
Arbitrage: ${formatEUR(arbitrageRevenue)}
Total: ${formatEUR(revenue)}

Financials:
EBITDA: ${formatEUR(ebitda)}
Payback: ${payback.toFixed(1)} years
IRR: ${irr.toFixed(1)}%
NPV: ${formatEUR(npv)}

Break-even CAPEX:
${formatEUR(breakEvenCapexPerMWh)} / MWh

Score:
${score}/100

Generated via Nordic BESS Pro
  `;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "BESS_Investment_Report.txt";

  link.click();
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
  <h3>Break-even CAPEX</h3>

  <div style={{
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "center"
  }}>
    
    <div style={{
      background: "#111827",
      color: "white",
      padding: "20px",
      borderRadius: "16px",
      fontSize: "22px",
      fontWeight: "bold"
    }}>
      {formatEUR(breakEvenCapexPerMWh)} / MWh
    </div>

    <div style={{ maxWidth: "420px" }}>
      <p style={{ color: "#475569" }}>
        This is the maximum CAPEX per MWh where the project NPV is approximately zero.
      </p>
      <p style={{ color: "#475569" }}>
        If actual CAPEX is below this level, the project creates value.
      </p>
    </div>

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
  <h3>CAPEX Sensitivity</h3>
  <p style={{ color: "#475569" }}>
    Shows how project economics change if CAPEX moves -20%, base case or +20%.
  </p>

  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          <th style={tableCell}>Case</th>
          <th style={tableCell}>CAPEX</th>
          <th style={tableCell}>EBITDA</th>
          <th style={tableCell}>Payback</th>
          <th style={tableCell}>IRR</th>
          <th style={tableCell}>NPV</th>
        </tr>
      </thead>
      <tbody>
        {sensitivityCases.map((item) => {
          const s = runSensitivity(item.factor);
          return (
            <tr key={item.label}>
              <td style={tableCell}><strong>{item.label}</strong></td>
              <td style={tableCell}>{formatEUR(s.capex)}</td>
              <td style={tableCell}>{formatEUR(s.ebitda)}</td>
              <td style={tableCell}>{s.payback.toFixed(1)} y</td>
              <td style={tableCell}>{s.irr.toFixed(1)}%</td>
              <td style={tableCell}>{formatEUR(s.npv)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
<div style={cardStyle}>
  <h3>IRR Curve – CAPEX Sensitivity</h3>
  <p style={{ color: "#475569" }}>
    Visualizes how IRR changes when CAPEX moves from -30% to +30%.
  </p>

  <div style={{
    display: "flex",
    alignItems: "end",
    gap: "12px",
    height: "260px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflowX: "auto"
  }}>
    {irrCurveData.map((item) => (
      <div key={item.label} style={{
        minWidth: "70px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "end",
        height: "100%"
      }}>
        <div style={{
          fontSize: "13px",
          fontWeight: "bold",
          marginBottom: "6px",
          color: item.irr >= 12 ? "#059669" : item.irr >= 8 ? "#f59e0b" : "#dc2626"
        }}>
          {item.irr.toFixed(1)}%
        </div>

        <div style={{
          width: "42px",
          height: `${Math.max(8, (Math.max(item.irr, 0) / maxIrr) * 180)}px`,
          borderRadius: "10px 10px 0 0",
          background: item.irr >= 12 ? "#10b981" : item.irr >= 8 ? "#f59e0b" : "#ef4444"
        }} />

        <div style={{
          fontSize: "12px",
          marginTop: "8px",
          color: "#334155",
          fontWeight: "bold"
        }}>
          {item.label}
        </div>
      </div>
    ))}
  </div>

  <p style={{ marginTop: "12px", color: "#475569" }}>
    Base CAPEX: <strong>{formatEUR(capex)}</strong>.  
    Lower CAPEX improves IRR, while higher CAPEX reduces bankability.
  </p>
</div>
          
        <div style={cardStyle}>
          <h3>Investor Summary</h3>
          <button onClick={() => setShowSummary(!showSummary)} style={buttonStyle("#111827")}>
            {showSummary ? "Hide Investor Summary" : "Generate Investor Summary"}
          </button>

<button
  onClick={exportPDF}
  style={{
    marginTop: "10px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold"
  }}
>
  Export Report
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

const tableCell = {
  padding: "10px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left",
  fontSize: "14px"
};

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
