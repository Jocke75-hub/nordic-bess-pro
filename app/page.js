'use client'

import { useState } from "react";
import jsPDF from "jspdf";

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
  const doc = new jsPDF();
  const logo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAFvAzIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKSloAKKSloAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBtDVHNNHDGzySKiqMszHAHua8V+IX7WngnwRJNaWdy/iTU4/lNtpeGVW9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";
  if (logo) {
  doc.addImage(logo, "PNG", 150, 8, 40, 15);
}
  const today = new Date().toLocaleDateString("en-GB");

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  function sectionTitle(title) {
    y += 8;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y - 5, pageWidth - 28, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(title, 18, y + 1);
    y += 10;
    doc.setTextColor(0, 0, 0);
  }

  function row(label, value) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label, 18, y);
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), 90, y);
    y += 7;
  }

  function metricBox(label, value, x, yPos) {
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, yPos, 55, 24, 3, 3, "FD");

    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(label, x + 4, yPos + 8);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), x + 4, yPos + 18);
  }
  function kpiCard(label, value, x, yPos, w = 55, h = 26) {
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, yPos, w, h, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(label, x + 4, yPos + 8);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(String(value), x + 4, yPos + 19);
}
  const rating =
    score >= 75
      ? "Strong early-stage case"
      : score >= 55
      ? "Promising but needs validation"
      : "Weak or high-risk case";

  const interpretation =
    score >= 75
      ? "The project shows strong profitability indicators with positive NPV, attractive IRR and reasonable payback. The case appears promising under current assumptions, subject to validation of grid connection, market access and supplier pricing."
      : score >= 55
      ? "The project may be interesting, but the outcome is sensitive to FCR price, arbitrage spread, CAPEX and availability. Further due diligence is recommended before investment decision."
      : "Under current assumptions, the project does not appear bankable. CAPEX, revenue assumptions or market access would need to improve materially.";

// Header background
doc.setFillColor(15, 23, 42);
doc.rect(0, 0, pageWidth, 35, "F");

// Logo (top right)
doc.addImage(logo, "JPEG", pageWidth - 45, 6, 35, 14);

// Text styling
doc.setTextColor(255, 255, 255);

// LEFT
doc.setFontSize(16);
doc.text("NexaTrade Oy Ltd", 14, 16);

doc.setFontSize(10);
doc.text("Nordic BESS Investment Report", 14, 24);

// CENTER
doc.setFontSize(10);
doc.text(
  "Prepared for early-stage screening",
  pageWidth / 2,
  24,
  { align: "center" }
);

// LEFT meta
doc.setFontSize(9);
doc.text(`Generated: ${today}`, 14, 30);

// Continue content below header
y = 45;
  
doc.setFontSize(10);
doc.setTextColor(80, 80, 80);
doc.text("Prepared by NexaTrade Oy Ltd", 14, y);

  y += 8;
  
  // Executive Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text("Executive Summary", 14, y);
  y += 8;

  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(interpretation, pageWidth - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 6;

  // KPI cards
kpiCard("IRR", `${irr.toFixed(1)}%`, 14, y);
kpiCard("NPV", formatEUR(npv), 75, y);
kpiCard("Payback", `${payback.toFixed(1)} y`, 136, y);

y += 34;

kpiCard("Score", `${score}/100`, 14, y);
kpiCard("Total CAPEX", formatEUR(capex), 75, y);
kpiCard("Break-even", `${formatEUR(breakEvenCapexPerMWh)}/MWh`, 136, y);

y += 36;

  sectionTitle("Project Configuration");
  row("Power", `${mw} MW`);
  row("Capacity", `${mwh} MWh`);
  row("Lifetime", `${lifetime} years`);
  row("Discount rate", `${discountRate}%`);

  sectionTitle("Investment Assumptions");
  row("CAPEX per MWh", `${formatEUR(capexPerMWh)} / MWh`);
  row("Total CAPEX", formatEUR(capex));
  row("Annual OPEX", formatEUR(opex));
  row("OPEX assumption", `${opexPercent}% of CAPEX / year`);

  sectionTitle("Revenue Assumptions");
  row("FCR price", `EUR ${fcr}/MW/h`);
  row("Arbitrage spread", `EUR ${spread}/MWh`);
  row("Cycles per day", cycles);
  row("FCR revenue", formatEUR(fcrRevenue));
  row("Arbitrage revenue", formatEUR(arbitrageRevenue));
  row("Total annual revenue", formatEUR(revenue));

  if (y > 200) {
  doc.addPage();
  y = 20;
}
  const requiredSpace = 80;

if (y + requiredSpace > 280) {
  doc.addPage();
  y = 20;
}

sectionTitle("Financial Output");

kpiCard("EBITDA", formatEUR(ebitda), 14, y);
kpiCard("IRR", `${irr.toFixed(1)}%`, 75, y);
kpiCard("NPV", formatEUR(npv), 136, y);

y += 34;

kpiCard("Payback", `${payback.toFixed(1)} y`, 14, y);
kpiCard("Break-even", `${formatEUR(breakEvenCapexPerMWh)}/MWh`, 75, y);
kpiCard("Score", `${score}/100`, 136, y);

y += 36;

row("Rating", rating);

  // Footer
  if (y > 240) {
  doc.addPage();
  y = 20;
}
  
y += 10;
doc.setFontSize(9);
doc.setTextColor(100, 100, 100);
doc.text("NexaTrade Oy Ltd – Energy Advisory & Project Development", 14, y);
  
y += 10;
doc.setFontSize(8);
doc.setTextColor(120, 120, 120);
doc.text(
  "Disclaimer: This report is an early-stage screening output. It is not investment advice. All assumptions should be validated through technical, commercial, legal and financial due diligence.",
  14,
  y,
  { maxWidth: pageWidth - 28 }
);
  doc.save("Nordic_BESS_Pro_Investment_Report.pdf");
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
