import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import "./heatmap.css";

/* ===== Generate last 12 months (ALL days included) ===== */
const generateLast12MonthsData = () => {
  const data = [];
  const today = new Date();

  const start = new Date();
  start.setFullYear(today.getFullYear() - 1);
  start.setDate(start.getDate() + 1);

  const current = new Date(start);

  while (current <= today) {
    data.push({
      date: current.toISOString().split("T")[0],
      count: Math.random() > 0.7 ? Math.floor(Math.random() * 12) : 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return data;
};

const HeatMapProfile = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    setData(generateLast12MonthsData());
  }, []);

  return (
    <div className="heatmap-container">
      <h4>Contribution Activity (Last 12 Months)</h4>

      <div className="heatmap-scroll">
        <HeatMap
          value={data}
          startDate={
            new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            )
          }

          /* ===== GRID ===== */
          rectSize={14}
          space={4}

          /* ===== DAYS AS ROWS ===== */
          weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}

          /* ===== MONTH NAMES ===== */
          monthLabels={[
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
          ]}

          /* ===== FORCE LABEL VISIBILITY (INLINE SVG) ===== */
          monthLabelStyle={{
            fill: "#ffffff",
            fontSize: 12,
            fontWeight: 600,
          }}

          weekLabelStyle={{
            fill: "#ffffff",
            fontSize: 12,
            fontWeight: 500,
          }}

          /* ===== REMOVE DEFAULT LEGEND ===== */
          legendRender={() => null}

          /* ===== COLORS ===== */
          panelColors={{
            0: "#21262d",   // empty day (visible)
            2: "#0e4429",
            5: "#006d32",
            8: "#26a641",
            10: "#39d353",
          }}
        />
      </div>

      {/* ===== CUSTOM LEGEND ===== */}
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="scale">
          <i style={{ background: "#21262d" }} />
          <i style={{ background: "#0e4429" }} />
          <i style={{ background: "#006d32" }} />
          <i style={{ background: "#26a641" }} />
          <i style={{ background: "#39d353" }} />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatMapProfile;
