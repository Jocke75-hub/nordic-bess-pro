'use client'

import { useState } from "react";

export default function Home() {
  const [mw, setMw] = useState(5);
  const [mwh, setMwh] = useState(10);
  const [spread, setSpread] = useState(45);
  const [cycles, setCycles] = useState(1);
  const [fcr, setFcr] = useState(12);

  const efficiency = 0.88;
  const reserveShare = 0.7;
  const arbitrageShare = 0.3;

  const fcrRevenue = mw * reserveShare * fcr * 8760 * 0.9;
  const arbitrageRevenue =
    mwh * arbitrageShare * cycles * 365 * spread * efficiency;

  const revenue = fcrRevenue + arbitrageRevenue;
  const costs = 86000;
  const ebitda = revenue - costs;
  const capex = 2500000;
  const payback = ebitda > 0 ? capex / ebitda : 0;

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>⚡ Nordic BESS Pro</h1>

      <h3>Inputs</h3>

      <div>
        MW:
        <input value={mw} onChange={(e) => setMw(e.target.value)} />
      </div>

      <div>
        MWh:
        <input value={mwh} onChange={(e) => setMwh(e.target.value)} />
      </div>

      <div>
        Spread €/MWh:
        <input value={spread} onChange={(e) => setSpread(e.target.value)} />
      </div>

      <div>
        Cycles/day:
        <input value={cycles} onChange={(e) => setCycles(e.target.value)} />
      </div>

      <div>
        FCR €/MW/h:
        <input value={fcr} onChange={(e) => setFcr(e.target.value)} />
      </div>

      <h3>Results</h3>

      <p>Revenue: €{Math.round(revenue)}</p>
      <p>EBITDA: €{Math.round(ebitda)}</p>
      <p>Payback: {payback.toFixed(1)} years</p>
    </div>
  );
}
