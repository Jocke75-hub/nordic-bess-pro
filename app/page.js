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

  const efficiency = 0.88;
  const reserveShare = 0.7;
  const arbitrageShare = 0.3;
  const availability = 0.9;

  const capex = mwh * capexPerMWh;
  const opex = capex * (opexPercent / 100);

  const fcrRevenue = mw * reserveShare * fcr * 8760 * availability;
  const arbitrageRevenue =
    mwh * arbitrageShare * cycles * 365 * spread * efficiency;

  const revenue = fcrRevenue + arbitrageRevenue;
  const ebitda = revenue - opex;
  const payback = ebitda > 0 ? capex / ebitda : 0;

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

  const irr = ebitda > 0 ? calculateIRR(capex, ebitda, lifetime) : 0;

  const formatEUR = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div style={{ padding: 30, fontFamily: "Arial", maxWidth: 760 }}>
      <h1>⚡ Nordic BESS Pro V1</h1>
      <p>
        Nordic-first BESS profitability screening with FCR, arbitrage, CAPEX,
        OPEX, payback and IRR.
      </p>

      <h3>Project Inputs</h3>

      <label>MW</label><br />
      <input value={mw} onChange={(e) => setMw(Number(e.target.value))} /><br />

      <label>MWh</label><br />
      <input value={mwh} onChange={(e) => setMwh(Number(e.target.value))} /><br />

      <label>CAPEX €/MWh</label><br />
      <input value={capexPerMWh} onChange={(e) => setCapexPerMWh(Number(e.target.value))} /><br />

      <label>OPEX % of CAPEX / year</label><br />
      <input value={opexPercent} onChange={(e) => setOpexPercent(Number(e.target.value))} /><br />

      <label>Lifetime, years</label><br />
      <input value={lifetime} onChange={(e) => setLifetime(Number(e.target.value))} /><br />

      <h3>Revenue Inputs</h3>

      <label>Spread €/MWh</label><br />
      <input value={spread} onChange={(e) => setSpread(Number(e.target.value))} /><br />

      <label>Cycles/day</label><br />
      <input value={cycles} onChange={(e) => setCycles(Number(e.target.value))} /><br />

      <label>FCR €/MW/h</label><br />
      <input value={fcr} onChange={(e) => setFcr(Number(e.target.value))} /><br />

      <h3>Results</h3>

      <p>Total CAPEX: {formatEUR(capex)}</p>
      <p>Annual OPEX: {formatEUR(opex)}</p>
      <p>FCR revenue: {formatEUR(fcrRevenue)}</p>
      <p>Arbitrage revenue: {formatEUR(arbitrageRevenue)}</p>
      <p>Total revenue: {formatEUR(revenue)}</p>
      <p>EBITDA: {formatEUR(ebitda)}</p>
      <p>Payback: {payback.toFixed(1)} years</p>
      <p>IRR: {irr.toFixed(1)}%</p>

      <h3>Interpretation</h3>
      <p>
        {irr > 15 && payback < 7
          ? "This project shows a strong early-stage financial profile under the current assumptions."
          : irr > 8
          ? "This project may be interesting, but assumptions should be validated before investment decisions."
          : "Under current assumptions, this project appears weak or needs better revenue/cost conditions."}
      </p>
    </div>
  );
}
